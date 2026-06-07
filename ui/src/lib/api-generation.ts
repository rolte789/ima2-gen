import type {
  GenerateRequest,
  GenerateResponse,
  MultimodeGenerateRequest,
  MultimodeGenerateResponse,
  GenerateItem,
} from "../types";
import { jsonFetch } from "./api-core";
import { subscribe, ensureConnected, armStreamTimeout } from "./eventChannel";
import { cancelInflight } from "./api-inflight";

export function postGenerate(payload: GenerateRequest): Promise<GenerateResponse> {
  return jsonFetch<GenerateResponse>("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export async function postMultimodeGenerateStream(
  payload: MultimodeGenerateRequest,
  handlers: {
    onPartial?: (partial: { image: string; requestId?: string | null; sequenceId?: string | null; index?: number | null }) => void;
    onImage?: (image: GenerateItem) => void;
    onPhase?: (phase: { phase?: string; requestId?: string | null; sequenceId?: string | null; maxImages?: number }) => void;
  } = {},
  options: { signal?: AbortSignal } = {},
): Promise<MultimodeGenerateResponse> {
  const requestId = payload.requestId ?? `req_${Date.now().toString(36)}`;
  ensureConnected();

  const res = await fetch("/api/generate/multimode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, async: true, requestId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string; code?: string; status?: number };
    const e = new Error(data.error ?? `Request failed: ${res.status}`) as Error & { code?: string; status?: number };
    e.code = data.code;
    e.status = data.status ?? res.status;
    throw e;
  }

  return new Promise<MultimodeGenerateResponse>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimer();
      unsub();
      fn();
    };
    const unsub = subscribe(requestId, null, (event, data) => {
      if (settled) return;
      if (event === "partial") {
        handlers.onPartial?.(data as { image: string; requestId?: string | null; sequenceId?: string | null; index?: number | null });
      } else if (event === "image") {
        handlers.onImage?.(data as unknown as GenerateItem);
      } else if (event === "phase") {
        handlers.onPhase?.(data as { phase?: string; requestId?: string | null; sequenceId?: string | null; maxImages?: number });
      } else if (event === "done") {
        finish(() => resolve(data as unknown as MultimodeGenerateResponse));
      } else if (event === "error") {
        const err = data as { error?: string; code?: string; status?: number };
        const e = new Error(err.error ?? "Multimode generation failed") as Error & { code?: string; status?: number };
        e.code = err.code;
        e.status = err.status;
        finish(() => reject(e));
      }
    });
    const clearTimer = armStreamTimeout(() => {
      finish(() => {
        void cancelInflight(requestId);
        reject(new Error("Multimode generation stream timed out"));
      });
    });

    if (options.signal) {
      if (options.signal.aborted) {
        finish(() => {
          void cancelInflight(requestId);
          reject(new DOMException("Aborted", "AbortError"));
        });
        return;
      }
      options.signal.addEventListener("abort", () => {
        finish(() => {
          void cancelInflight(requestId);
          reject(new DOMException("Aborted", "AbortError"));
        });
      }, { once: true });
    }
  });
}

export function postEdit(payload: GenerateRequest & { mask?: string }): Promise<GenerateResponse> {
  return jsonFetch<GenerateResponse>("/api/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export async function importLocalImage(file: File): Promise<GenerateItem> {
  const buffer = await file.arrayBuffer();
  const res = await fetch("/api/history/import-local", {
    method: "POST",
    headers: {
      "Content-Type": file.type || "image/png",
      "X-Ima2-Original-Filename": encodeURIComponent(file.name),
    },
    body: buffer,
  });
  if (!res.ok) {
    let detail: { error?: string; code?: string } = {};
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    const err = new Error(detail.error || `Import failed (${res.status})`);
    (err as Error & { code?: string }).code = detail.code || "IMPORT_FAILED";
    throw err;
  }
  const json = (await res.json()) as { item: GenerateItem };
  return json.item;
}

export type PromptBuilderChatRequest = {
  model?: string;
  messages: Array<{
    role: string;
    content: string;
    attachments?: Array<{
      kind: "image" | "text" | "file";
      name: string;
      mimeType: string;
      size: number;
      dataUrl?: string;
      text?: string;
    }>;
  }>;
  context?: {
    currentPrompt?: string;
    insertedPrompts?: Array<{ name?: string; text?: string }>;
    settings?: Record<string, unknown>;
    currentResultPrompt?: string | null;
  };
};

export type PromptBuilderChatResponse = {
  provider: string;
  model: string;
  message: { role: "assistant"; content: string };
  usage: Record<string, unknown> | null;
};

export function postPromptBuilderChat(
  body: PromptBuilderChatRequest,
): Promise<PromptBuilderChatResponse> {
  return jsonFetch<PromptBuilderChatResponse>("/api/prompt-builder/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type VideoGenerateRequest = {
  prompt: string;
  provider?: "grok";
  model?: string;
  mode?: "text-to-video" | "image-to-video" | "reference-to-video";
  sourceImage?: string;
  sourceFilename?: string;
  referenceImages?: string[];
  referenceFilenames?: string[];
  continueFromVideo?: string;
  continuityLineage?: import("../types").VideoContinuityLineage | null;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  topic?: string;
  sessionId?: string | null;
  clientNodeId?: string | null;
  clientRequestId?: string;
  requestId?: string;
  storyboard?: boolean;
};

export type VideoGenerateDone = {
  requestId: string;
  filename: string;
  url: string;
  mediaType: "video";
  revisedPrompt?: string | null;
  elapsed?: number;
  video?: Record<string, unknown>;
  videoSeries?: { topic?: string; chainIndex?: number } | null;
  videoContinuity?: import("../types").VideoContinuityLineage | null;
};

export async function postVideoGenerateStream(
  payload: VideoGenerateRequest,
  handlers: {
    onPlanning?: () => void;
    onSubmitted?: (d: { xaiVideoRequestId?: string }) => void;
    onProgress?: (d: { progress?: number | null; stalled?: boolean }) => void;
  } = {},
  options: { signal?: AbortSignal } = {},
): Promise<VideoGenerateDone> {
  const requestId = payload.requestId ?? `vreq_${Date.now().toString(36)}`;
  ensureConnected();

  const res = await fetch("/api/video/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "grok", ...payload, async: true, requestId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string; code?: string; status?: number };
    const e = new Error(data.error ?? `Request failed: ${res.status}`) as Error & { code?: string; status?: number };
    e.code = data.code;
    e.status = data.status ?? res.status;
    throw e;
  }

  return new Promise<VideoGenerateDone>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimer();
      unsub();
      fn();
    };
    const unsub = subscribe(requestId, null, (event, data) => {
      if (settled) return;
      if (event === "planning") handlers.onPlanning?.();
      else if (event === "submitted") handlers.onSubmitted?.(data as { xaiVideoRequestId?: string });
      else if (event === "progress") handlers.onProgress?.(data as { progress?: number | null; stalled?: boolean });
      else if (event === "done") {
        finish(() => resolve(data as unknown as VideoGenerateDone));
      } else if (event === "error") {
        const err = data as { error?: string; code?: string; status?: number };
        const e = new Error(err.error ?? "Video generation failed") as Error & { code?: string; status?: number };
        e.code = err.code;
        e.status = err.status;
        finish(() => reject(e));
      }
    });
    const clearTimer = armStreamTimeout(() => {
      finish(() => {
        void cancelInflight(requestId);
        reject(new Error("Video generation stream timed out"));
      });
    });

    if (options.signal) {
      if (options.signal.aborted) {
        finish(() => {
          void cancelInflight(requestId);
          reject(new DOMException("Aborted", "AbortError"));
        });
        return;
      }
      options.signal.addEventListener("abort", () => {
        finish(() => {
          void cancelInflight(requestId);
          reject(new DOMException("Aborted", "AbortError"));
        });
      }, { once: true });
    }
  });
}
