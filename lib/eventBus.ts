import { EventEmitter } from "node:events";

export interface BusEvent {
  id: number;
  jobId: string;
  event: string;
  data: Record<string, unknown>;
}

/** Global replay window — sized for 7+ concurrent jobs (~15 events each) with reconnect headroom. */
export const RING_SIZE = 2000;
/** Align with /api/events connection cap — avoids MaxListenersExceededWarning under load. */
export const MAX_SSE_LISTENERS = 512;
const bus = new EventEmitter();
bus.setMaxListeners(MAX_SSE_LISTENERS);

let seq = 0;
const ring: BusEvent[] = [];

function toRingEntry(entry: BusEvent): BusEvent | null {
  const image = entry.data.image;
  const hasLargeImage = typeof image === "string" && image.length > 1000;
  if (!hasLargeImage) return entry;
  // Keep terminal/partial metadata replayable; omit multi-MB base64 from the ring.
  if (entry.event === "partial" || entry.event === "image" || entry.event === "done") {
    const { image: _omit, ...rest } = entry.data as Record<string, unknown> & { image?: string };
    return { ...entry, data: { ...rest, _imageOmitted: true } };
  }
  return null;
}

export function publish(jobId: string, event: string, data: Record<string, unknown>): void {
  seq++;
  const entry: BusEvent = { id: seq, jobId, event, data };
  const ringEntry = toRingEntry(entry);
  if (ringEntry) {
    ring.push(ringEntry);
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
