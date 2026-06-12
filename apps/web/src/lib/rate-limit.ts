/**
 * In-memory sliding-window rate limiter (TRD §7). Production uses a Redis sliding window so the
 * limit is shared across instances; this single-process version is correct for one node and keeps
 * the API contract identical (ADR-0004 pattern). Pure given an injected clock — unit-tested.
 */
interface Window {
  hits: number[];
}

const store = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Milliseconds until the window frees a slot (for Retry-After). */
  resetMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (store.get(key)?.hits ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const oldest = hits[0]!;
    store.set(key, { hits });
    return { ok: false, remaining: 0, resetMs: Math.max(0, oldest + windowMs - now) };
  }

  hits.push(now);
  store.set(key, { hits });
  return { ok: true, remaining: limit - hits.length, resetMs: windowMs };
}

/** Best-effort client key from proxy headers, falling back to a single local bucket. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

/** Test-only: reset the shared store. */
export function __resetRateLimits(): void {
  store.clear();
}
