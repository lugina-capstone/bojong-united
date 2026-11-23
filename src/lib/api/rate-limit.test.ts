import { describe, expect, it } from "vitest";

import { getRateLimitState, getWindowStart } from "@/lib/api/rate-limit";

const now = new Date("2026-11-23T10:15:42.500Z");

describe("rate limit", () => {
  it("jendela dimulai di awal menit", () => {
    expect(getWindowStart(now).toISOString()).toBe("2026-11-23T10:15:00.000Z");
  });

  it("mengizinkan sampai batas dan menolak sesudahnya", () => {
    const windowStart = getWindowStart(now);
    const last = getRateLimitState(60, 60, windowStart, now);
    expect(last.allowed).toBe(true);
    expect(last.headers["X-RateLimit-Remaining"]).toBe("0");

    const over = getRateLimitState(61, 60, windowStart, now);
    expect(over.allowed).toBe(false);
    expect(over.retryAfterSeconds).toBe(18);
    expect(over.headers["X-RateLimit-Reset"]).toBe(
      String(Date.parse("2026-11-23T10:16:00.000Z") / 1000),
    );
  });
});
