import { EventEmitter } from "node:events";

export interface BusEvent {
  id: number;
  jobId: string;
  event: string;
  data: Record<string, unknown>;
}

const RING_SIZE = 500;
const bus = new EventEmitter();
bus.setMaxListeners(100);

let seq = 0;
const ring: BusEvent[] = [];

export function publish(jobId: string, event: string, data: Record<string, unknown>): void {
  seq++;
  const entry: BusEvent = { id: seq, jobId, event, data };
  const hasLargeImage = typeof (data as any).image === "string" && (data as any).image.length > 1000;
  if (!hasLargeImage) {
    ring.push(entry);
    if (ring.length > RING_SIZE) ring.shift();
  }
  bus.emit("event", entry);
}

export function subscribe(listener: (ev: BusEvent) => void): () => void {
  bus.on("event", listener);
  return () => bus.off("event", listener);
}

export function replaySince(lastEventId: number): BusEvent[] {
  const idx = ring.findIndex(e => e.id > lastEventId);
  return idx === -1 ? [] : ring.slice(idx);
}

export function _resetForTest(): void {
  seq = 0;
  ring.length = 0;
  bus.removeAllListeners();
}
