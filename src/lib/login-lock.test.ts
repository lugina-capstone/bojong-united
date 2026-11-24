import { describe, expect, it } from "vitest";

import { LOCK_MINUTES, nextLoginFailure } from "@/lib/login-lock";

describe("nextLoginFailure", () => {
  const now = new Date("2026-11-24T10:00:00Z");

  it("menambah hitungan sebelum percobaan ke-5", () => {
    expect(nextLoginFailure(0, now)).toEqual({
      failedLoginCount: 1,
      lockedUntil: null,
    });
    expect(nextLoginFailure(3, now).lockedUntil).toBeNull();
  });

  it("mengunci akun 15 menit pada percobaan ke-5", () => {
    const result = nextLoginFailure(4, now);
    expect(result.failedLoginCount).toBe(0);
    expect(result.lockedUntil?.getTime()).toBe(
      now.getTime() + LOCK_MINUTES * 60 * 1000,
    );
  });
});
