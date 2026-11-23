export const RATE_LIMIT_WINDOW_MS = 60_000;

export function getWindowStart(now: Date) {
  return new Date(
    Math.floor(now.getTime() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS,
  );
}

/** Status rate limit setelah request ke-`count` di jendela yang dimulai pada `windowStart`. */
export function getRateLimitState(
  count: number,
  limit: number,
  windowStart: Date,
  now: Date,
) {
  const resetAt = windowStart.getTime() + RATE_LIMIT_WINDOW_MS;
  return {
    allowed: count <= limit,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(Math.max(0, limit - count)),
      "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    },
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now.getTime()) / 1000)),
  };
}
