import "server-only";

import { headers } from "next/headers";

import { getRateLimitState, getWindowStart } from "@/lib/api/rate-limit";
import { db } from "@/lib/db";

/** Batas percobaan per alamat IP per menit untuk aksi akses akun yang bisa dipanggil tanpa login. */
export const AUTH_RATE_LIMITS = {
  signIn: 10,
  signUp: 5,
  verifyOtp: 10,
  resendOtp: 5,
  forgotPassword: 5,
  resetPassword: 5,
  organizationCode: 20,
} as const;

export type AuthRateLimitAction = keyof typeof AUTH_RATE_LIMITS;

/** IP klien dari reverse proxy; deployment wajib menimpa `x-forwarded-for` dari klien. */
async function clientIp() {
  const list = await headers();
  return (
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    list.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** Hitung satu percobaan secara atomik. Mengembalikan pesan error jika batas terlampaui, selain itu null. */
export async function limitAuthAction(action: AuthRateLimitAction) {
  const now = new Date();
  const windowStart = getWindowStart(now);
  const key = `${action}:${await clientIp()}`;
  const [row] = await db.$queryRaw<[{ count: number }]>`
    INSERT INTO "auth_rate_limits" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart")
    DO UPDATE SET "count" = "auth_rate_limits"."count" + 1
    RETURNING "count"`;
  if (row.count === 1) {
    await db.authRateLimit.deleteMany({
      where: { windowStart: { lt: windowStart } },
    });
  }
  const state = getRateLimitState(
    row.count,
    AUTH_RATE_LIMITS[action],
    windowStart,
    now,
  );
  return state.allowed
    ? null
    : `Terlalu banyak percobaan. Coba lagi dalam ${state.retryAfterSeconds} detik.`;
}
