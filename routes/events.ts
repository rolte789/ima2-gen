import type { Express, Response } from "express";
import type { RouteRuntimeContext } from "../lib/runtimeContext.js";
import { subscribe, replaySince, MAX_SSE_LISTENERS } from "../lib/eventBus.js";

let activeConnections = 0;

function safeWrite(res: Response, chunk: string): boolean {
  if (res.writableEnded || res.destroyed) return false;
  try {
    res.write(chunk);
    return true;
  } catch {
    return false;
  }
}

function formatSse(ev: { id: number; jobId: string; event: string; data: Record<string, unknown> }): string {
  return `id: ${ev.id}\nevent: ${ev.event}\ndata: ${JSON.stringify({ ...ev.data, jobId: ev.jobId })}\n\n`;
}

export function registerEventsRoute(app: Express, _ctx: RouteRuntimeContext) {
  app.get("/api/events", (req, res) => {
    if (activeConnections >= MAX_SSE_LISTENERS) {
      return res.status(503).json({
        error: { code: "SSE_CAPACITY", message: "Too many event stream connections" },
      });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    activeConnections++;

    const headerLastId = parseInt(req.headers["last-event-id"] as string, 10);
    const queryLastId = parseInt(String(req.query.lastEventId ?? ""), 10);
    const lastId = !Number.isNaN(headerLastId) ? headerLastId : queryLastId;
    if (!Number.isNaN(lastId)) {
      for (const ev of replaySince(lastId)) {
        if (!safeWrite(res, formatSse(ev))) break;
      }
    }

    let cleaned = false;
    const unsub = subscribe((ev) => {
      if (!safeWrite(res, formatSse(ev))) cleanup();
    });

    const heartbeat = setInterval(() => {
      if (!safeWrite(res, ": ping\n\n")) cleanup();
    }, 15_000);

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      unsub();
      clearInterval(heartbeat);
      activeConnections = Math.max(0, activeConnections - 1);
    }

    req.on("close", cleanup);
    res.on("close", cleanup);
    res.on("error", cleanup);
  });
}
