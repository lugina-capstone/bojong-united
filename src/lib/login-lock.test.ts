import { describe, expect, it } from "vitest";

import { LOCK_MINUTES, lockAfterFailure } from "@/lib/login-lock";

describe("lockAfterFailure", () => {
  const now = new Date("2026-11-24T10:00:00Z");

  it("belum mengunci sebelum percobaan ke-5", () => {
    expect(lockAfterFailure(1, now)).toBeNull();
    expect(lockAfterFailure(4, now)).toBeNull();
  });

  it("mengunci akun 15 menit pada percobaan ke-5", () => {
    expect(lockAfterFailure(5, now)?.getTime()).toBe(
      now.getTime() + LOCK_MINUTES * 60 * 1000,
    );
  });
});
