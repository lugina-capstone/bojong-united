import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import {
  OTP_LENGTH,
  OTP_RESEND_SECONDS,
  OTP_VALID_MINUTES,
  otpResendKey,
  RESET_LINK_MINUTES,
} from "@/lib/otp";
import {
  LOCK_MINUTES,
  lockAfterFailure,
  MAX_FAILED_LOGINS,
} from "@/lib/login-lock";

function sendLinkEmail(
  to: string,
  subject: string,
  action: string,
  url: string,
) {
  // Tidak di-await agar waktu respons tidak membocorkan apakah email terdaftar.
  void sendEmail({
    to,
    subject,
    text: `${action}:\n${url}\n\nAbaikan email ini jika Anda tidak memintanya.`,
    html: `<p>${action}:</p><p><a href="${url}">${url}</a></p><p>Abaikan email ini jika Anda tidak memintanya.</p>`,
  }).catch((error: unknown) => {
    console.error(`Gagal mengirim email "${subject}"`, error);
  });
}

/** Endpoint emailOTP yang tidak dipakai Becraft (masuk/reset/ganti email lewat OTP). */
const UNUSED_OTP_PATHS = new Set([
  "/sign-in/email-otp",
  "/forget-password/email-otp",
  "/email-otp/request-password-reset",
  "/email-otp/reset-password",
  "/email-otp/check-verification-otp",
  "/email-otp/request-email-change",
  "/email-otp/change-email",
]);

const NO_OAUTH_TOKENS = {
  accessToken: null,
  refreshToken: null,
  idToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
};

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  user: {
    additionalFields: {
      isAdministrator: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: RESET_LINK_MINUTES * 60,
    sendResetPassword: async ({ user, url }) => {
      sendLinkEmail(
        user.email,
        "Reset kata sandi Becraft",
        "Klik tautan berikut untuk membuat password baru",
        url,
      );
    },
  },
  emailVerification: {
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  onAPIError: { errorURL: `${env.BETTER_AUTH_URL}/masuk` },
  // Token Google hanya dipakai saat masuk, jadi tidak disimpan.
  databaseHooks: {
    account: {
      create: {
        before: async (account) => ({
          data: { ...account, ...NO_OAUTH_TOKENS },
        }),
      },
      update: {
        before: async (account) => ({
          data: { ...account, ...NO_OAUTH_TOKENS },
        }),
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (UNUSED_OTP_PATHS.has(ctx.path))
        throw new APIError("NOT_FOUND", { message: "Not found" });
      if (
        ctx.path !== "/sign-in/email" &&
        ctx.path !== "/email-otp/verify-email"
      )
        return;
      const email = String(ctx.body?.email ?? "")
        .trim()
        .toLowerCase();
      const user = await db.user.findUnique({
        where: { email },
        select: { lockedUntil: true, emailVerified: true },
      });
      if (user?.lockedUntil && user.lockedUntil > new Date()) {
        throw new APIError("FORBIDDEN", {
          code: "ACCOUNT_LOCKED",
          message: `Akun dikunci ${LOCK_MINUTES} menit karena terlalu banyak percobaan masuk`,
        });
      }
      // OTP verifikasi hanya untuk email yang belum terverifikasi, agar tidak menjadi jalur masuk
      // tanpa kata sandi.
      if (ctx.path === "/email-otp/verify-email" && user?.emailVerified) {
        throw new APIError("BAD_REQUEST", {
          code: "INVALID_OTP",
          message: "Kode salah atau sudah kedaluwarsa",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = String(ctx.body?.email ?? "")
        .trim()
        .toLowerCase();
      const returned = ctx.context.returned;
      const failed =
        returned instanceof APIError &&
        returned.body?.code === "INVALID_EMAIL_OR_PASSWORD";
      if (failed) {
        // Increment atomik agar percobaan bersamaan tidak saling menimpa hitungan.
        const updated = await db.user.updateMany({
          where: { email },
          data: { failedLoginCount: { increment: 1 } },
        });
        if (updated.count === 0) return;
        const user = await db.user.findUnique({
          where: { email },
          select: { failedLoginCount: true },
        });
        const lockedUntil = lockAfterFailure(
          user?.failedLoginCount ?? 0,
          new Date(),
        );
        if (lockedUntil) {
          await db.user.updateMany({
            where: { email, failedLoginCount: { gte: MAX_FAILED_LOGINS } },
            data: { failedLoginCount: 0, lockedUntil },
          });
        }
      } else if (!(returned instanceof APIError)) {
        await db.user.updateMany({
          where: { email, failedLoginCount: { gt: 0 } },
          data: { failedLoginCount: 0, lockedUntil: null },
        });
      }
    }),
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            // Di komputer bersama, jangan langsung masuk dengan akun Google yang sedang aktif.
            prompt: "select_account",
          },
        }
      : undefined,
  // nextCookies harus menjadi plugin terakhir.
  plugins: [
    emailOTP({
      otpLength: OTP_LENGTH,
      expiresIn: OTP_VALID_MINUTES * 60,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "email-verification") return;
        const user = await db.user.findUnique({
          where: { email },
          select: { emailVerified: true },
        });
        if (!user || user.emailVerified) return;
        const identifier = otpResendKey(email);
        await db.verification.deleteMany({ where: { identifier } });
        await db.verification.create({
          data: {
            identifier,
            value: "",
            expiresAt: new Date(Date.now() + OTP_RESEND_SECONDS * 1000),
          },
        });
        void sendEmail({
          to: email,
          subject: `Kode verifikasi Becraft: ${otp}`,
          text: `Kode verifikasi email Anda: ${otp}\n\nKode berlaku 10 menit. Abaikan email ini jika Anda tidak mendaftar di Becraft.`,
          html: `<p>Kode verifikasi email Anda:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>Kode berlaku 10 menit. Abaikan email ini jika Anda tidak mendaftar di Becraft.</p>`,
        }).catch((error: unknown) => {
          console.error("Gagal mengirim kode verifikasi", error);
        });
      },
    }),
    nextCookies(),
  ],
});

export const googleEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);
