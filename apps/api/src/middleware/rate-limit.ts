import type { MiddlewareHandler } from "hono";

/* Simple in-memory sliding-window rate limiter.
   Single-process only — for a single-instance deployment this is fine.
   Swap for Redis later when scaling. */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000; // 1 minute

export function rateLimit(options?: {
  max?: number;
  windowMs?: number;
  keyFn?: (c: { req: { header: (n: string) => string | undefined } }) => string;
}): MiddlewareHandler {
  const max = options?.max ?? 10;
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const keyFn =
    options?.keyFn ??
    ((c) => {
      const fwd = c.req.header("x-forwarded-for") ?? "";
      const ip = fwd ? fwd.split(",")[0]!.trim() : "unknown";
      return ip;
    });

  return async (c, next) => {
    const key = keyFn(c);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    bucket.count++;
    if (bucket.count > max) {
      return c.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Try again in a minute.",
          },
        },
        429
      );
    }
    await next();
  };
}

// Housekeeping — prune old buckets so memory doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}, 60_000).unref();
