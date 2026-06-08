const DEFAULT_CAPACITY_RETRY_MS = 5000;
const MAX_CAPACITY_RETRY_MS = 30000;

export type AsyncJobError = Error & { code?: string; status?: number };

export function parseRetryAfterMs(value: string | null): number {
  if (!value) return DEFAULT_CAPACITY_RETRY_MS;
  const seconds = Number.parseFloat(value);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(MAX_CAPACITY_RETRY_MS, Math.max(1000, Math.round(seconds * 1000)));
  }
  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.min(MAX_CAPACITY_RETRY_MS, Math.max(1000, dateMs - Date.now()));
  }
  return DEFAULT_CAPACITY_RETRY_MS;
}

function isCapacityResponse(res: Response, data: { code?: unknown; error?: unknown }): boolean {
  return res.status === 429 && data.code === "TOO_MANY_JOBS";
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

export async function submitAsyncJobWithCapacityRetry<TErrorBody>({
  url,
  payload,
  requestId,
  signal,
  parseError,
}: {
  url: string;
  payload: Record<string, unknown>;
  requestId: string;
  signal?: AbortSignal;
  parseError: (res: Response, data: TErrorBody) => AsyncJobError;
}): Promise<void> {
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const wait = (ms: number): Promise<void> => new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    retryTimer = setTimeout(() => {
      retryTimer = null;
      resolve();
    }, ms);
    signal?.addEventListener("abort", () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      reject(abortError());
    }, { once: true });
  });

  while (true) {
    if (signal?.aborted) throw abortError();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, async: true, requestId }),
    });
    if (res.ok) return;

    const data = await res.json().catch(() => ({})) as TErrorBody;
    if (isCapacityResponse(res, data as { code?: unknown; error?: unknown })) {
      await wait(parseRetryAfterMs(res.headers.get("Retry-After")));
      continue;
    }
    throw parseError(res, data);
  }
}
