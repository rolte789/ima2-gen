type EventHandler = (event: string, data: Record<string, unknown>) => void;

interface Subscription {
  jobId: string;
  event: string | null;
  handler: EventHandler;
}

/** Max wait for done/error after async POST accepts the job (30 min). */
export const JOB_STREAM_TIMEOUT_MS = 30 * 60 * 1000;

let source: EventSource | null = null;
let lastEventId = "";
const subs: Set<Subscription> = new Set();
let resyncCallback: (() => void) | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let wasEverConnected = false;

const EVENT_TYPES = ["phase", "partial", "image", "done", "error", "submitted", "progress", "planning"];

function buildEventsUrl(): string {
  if (!lastEventId) return "/api/events";
  return `/api/events?lastEventId=${encodeURIComponent(lastEventId)}`;
}

function connect() {
  if (source && source.readyState !== EventSource.CLOSED) return;
  source = new EventSource(buildEventsUrl());

  source.onopen = () => {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (wasEverConnected) resyncCallback?.();
    wasEverConnected = true;
  };

  for (const type of EVENT_TYPES) {
    source.addEventListener(type, (ev: Event) => dispatch(type, ev as MessageEvent));
  }

  source.onerror = () => {
    source?.close();
    source = null;
    reconnectTimer = setTimeout(connect, 2000);
  };
}

function dispatch(eventType: string, ev: MessageEvent) {
  if (ev.lastEventId) lastEventId = ev.lastEventId;
  let data: Record<string, unknown>;
  try { data = JSON.parse(ev.data); } catch { return; }
  const jobId = (data.jobId ?? data.requestId ?? "") as string;
  if (!jobId) return;
  for (const sub of subs) {
    if (sub.jobId !== jobId) continue;
    if (sub.event !== null && sub.event !== eventType) continue;
    sub.handler(eventType, data);
  }
}

export function subscribe(
  jobId: string,
  event: string | null,
  handler: EventHandler,
): () => void {
  const sub: Subscription = { jobId, event, handler };
  subs.add(sub);
  if (!source || source.readyState === EventSource.CLOSED) connect();
  return () => { subs.delete(sub); };
}

export function armStreamTimeout(onTimeout: () => void, ms = JOB_STREAM_TIMEOUT_MS): () => void {
  const timer = setTimeout(onTimeout, ms);
  return () => clearTimeout(timer);
}

export function onResync(cb: () => void) {
  resyncCallback = cb;
}

export function disconnect() {
  source?.close();
  source = null;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  subs.clear();
  lastEventId = "";
  wasEverConnected = false;
}

export function ensureConnected() {
  if (!source || source.readyState === EventSource.CLOSED) connect();
}