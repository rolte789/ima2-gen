import { config } from "../config.js";
import {
  claimNextAgentQueueItem,
  completeAgentQueueItem,
  failAgentQueueItem,
  getAgentQueueItem,
  updateAgentQueueItemPlan,
  type AgentQueueLimits,
} from "./agentQueueStore.js";
import { requestAgentPlanFromModel } from "./agentPlannerModel.js";
import { runAgentGenerationPlan } from "./agentRuntime.js";
import type { AgentGenerationPlan, AgentQueueItem } from "./agentTypes.js";
import { errInfo } from "./errInfo.js";
import { finishJob, setJobPhase, startJob } from "./inflight.js";
import { logEvent } from "./logger.js";
import type { RuntimeContext } from "./runtimeContext.js";

const DEFAULT_LIMITS: AgentQueueLimits = {
  maxGlobalRunning: 2,
  maxSessionRunning: 1,
};

let workerTimer: NodeJS.Timeout | null = null;
let ticking = false;

export function ensureAgentQueueWorker(ctx: RuntimeContext) {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    void tickAgentQueueWorker(ctx);
  }, 1_500);
  workerTimer.unref?.();
  void tickAgentQueueWorker(ctx);
}

export function stopAgentQueueWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

export async function tickAgentQueueWorker(ctx: RuntimeContext) {
  if (ticking) return;
  ticking = true;
  try {
    while (true) {
      const item = claimNextAgentQueueItem(DEFAULT_LIMITS);
      if (!item) return;
      void runClaimedQueueItem(ctx, item.id).finally(() => {
        void tickAgentQueueWorker(ctx);
      });
    }
  } finally {
    ticking = false;
  }
}

// LLM planning runs only for plans the regex deriver produced automatically.
// Slash commands, manual settings, agy sessions, and already-LLM-planned
// retries keep their stored plan (audit decision F4/F5).
function isLlmPlanningEligible(item: AgentQueueItem): boolean {
  return Boolean(
    config.agentPlanner.enabled &&
    (item.plan.source === "auto-default" || item.plan.source === "auto-request") &&
    item.plan.command == null &&
    item.options.generationStrategy === "auto" &&
    item.options.provider !== "agy",
  );
}

async function resolveRuntimePlan(ctx: RuntimeContext, item: AgentQueueItem): Promise<AgentGenerationPlan> {
  if (!isLlmPlanningEligible(item)) return item.plan;
  try {
    const plan = await requestAgentPlanFromModel(ctx, {
      sessionId: item.sessionId,
      prompt: item.prompt,
      settings: item.options,
      requestId: item.requestId,
    });
    if (!plan) return item.plan;
    updateAgentQueueItemPlan(item.id, plan);
    return plan;
  } catch (error) {
    const err = errInfo(error);
    logEvent("agent_queue", "planner_fallback", { itemId: item.id, code: err.code, message: err.message });
    return item.plan;
  }
}

async function runClaimedQueueItem(ctx: RuntimeContext, itemId: string) {
  const item = getAgentQueueItem(itemId);
  if (!item) return;
  const plan = await resolveRuntimePlan(ctx, item);
  startJob({
    requestId: item.requestId,
    kind: "agent_queue",
    prompt: item.prompt,
    meta: {
      sessionId: item.sessionId,
      queueItemId: item.id,
      variants: plan.plannedVariants,
      parallelism: plan.plannedParallelism,
      requestedVariants: plan.requestedVariants,
    },
  });
  try {
    logEvent("agent_queue", "start", { itemId: item.id, sessionId: item.sessionId });
    setJobPhase(item.requestId, "streaming");
    const result = await runAgentGenerationPlan(ctx, item.sessionId, item.prompt, plan, {
      ...item.options,
      requestId: item.requestId,
      webSearchEnabled: item.options.webSearchEnabled,
      parallelism: plan.plannedParallelism,
    }, {
      appendUserTurn: false,
    });
    completeAgentQueueItem(item.id, result.imageIds);
    finishJob(item.requestId, {
      status: "completed",
      meta: { imageIds: result.imageIds },
    });
    logEvent("agent_queue", "finish", { itemId: item.id, imageCount: result.imageIds.length });
  } catch (error) {
    const err = errInfo(error);
    failAgentQueueItem(item.id, { code: err.code, message: err.message });
    finishJob(item.requestId, {
      status: "failed",
      errorCode: err.code,
      meta: { queueItemId: item.id },
    });
    logEvent("agent_queue", "error", { itemId: item.id, code: err.code, message: err.message });
  }
}
