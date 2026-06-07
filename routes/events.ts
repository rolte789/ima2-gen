import type { Express } from "express";
import type { RouteRuntimeContext } from "../lib/runtimeContext.js";
import { subscribe, replaySince } from "../lib/eventBus.js";

export function registerEventsRoute(app: Express, _ctx: RouteRuntimeContext) {
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const lastId = parseInt(req.headers["last-event-id"] as string, 10);
    if (!isNaN(lastId)) {
      for (const ev of replaySince(lastId)) {
        res.write(`id: ${ev.id}\nevent: ${ev.event}\ndata: ${JSON.stringify({ ...ev.data, jobId: ev.jobId })}\n\n`);
      }
    }

    const unsub = subscribe((ev) => {
      res.write(`id: ${ev.id}\nevent: ${ev.event}\ndata: ${JSON.stringify({ ...ev.data, jobId: ev.jobId })}\n\n`);
    });

    const heartbeat = setInterval(() => { res.write(": ping\n\n"); }, 15_000);

    req.on("close", () => {
      unsub();
      clearInterval(heartbeat);
    });
  });
}
