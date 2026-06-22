import { isLocalTurn } from "./agentLocalTurns";
import type { AgentQueueItem, AgentSessionRunSummary, AgentTurn } from "./agentTypes";

export type AgentRunProgress = {
  active: boolean;
  status: "queued" | "planning" | "running" | "error";
  labelKey: "pendingQueued" | "pendingPlanning" | "pendingGenerating" | "runError";
  queuedCount: number;
  runningCount: number;
  lastError?: string | null;
};

type DeriveAgentRunProgressInput = {
  turns: AgentTurn[];
  queueItems: AgentQueueItem[];
  runSummary?: AgentSessionRunSummary | null;
  localPendingCount: number;
};

export function deriveAgentRunProgress({
  turns,
  queueItems,
  runSummary,
  localPendingCount,
}: DeriveAgentRunProgressInput): AgentRunProgress | null {
  if (runSummary?.status === "error" && runSummary.lastError) {
    return {
      active: true,
      status: "error",
      labelKey: "runError",
      queuedCount: runSummary.queuedCount,
      runningCount: runSummary.runningCount,
      lastError: runSummary.lastError,
    };
  }

  if (runSummary?.status === "queued") {
    return {
      active: true,
      status: "queued",
      labelKey: "pendingQueued",
      queuedCount: runSummary.queuedCount,
      runningCount: runSummary.runningCount,
    };
  }

  if (runSummary?.status === "running") {
    const startedAt = findActiveQueueStartedAt(queueItems);
    const hasServerToolTurn = turns.some((turn) =>
      !isLocalTurn(turn) &&
      turn.role === "tool" &&
      (!startedAt || (turn.createdAt ?? 0) >= startedAt)
    );
    return {
      active: true,
      status: hasServerToolTurn ? "running" : "planning",
      labelKey: hasServerToolTurn ? "pendingGenerating" : "pendingPlanning",
      queuedCount: runSummary.queuedCount,
      runningCount: runSummary.runningCount,
    };
  }

  if (localPendingCount > 0) {
    return {
      active: true,
      status: "planning",
      labelKey: "pendingPlanning",
      queuedCount: runSummary?.queuedCount ?? 0,
      runningCount: runSummary?.runningCount ?? 0,
    };
  }

  return null;
}

function findActiveQueueStartedAt(queueItems: readonly AgentQueueItem[]): number | null {
  const active = queueItems
    .filter((item) => item.status === "running")
    .sort((a, b) => (a.startedAt ?? a.createdAt) - (b.startedAt ?? b.createdAt))[0];
  return active ? active.startedAt ?? active.createdAt ?? null : null;
}
