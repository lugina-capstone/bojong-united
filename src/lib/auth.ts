import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { OTP_LENGTH } from "@/lib/otp";
import { LOCK_MINUTES, nextLoginFailure } from "@/lib/login-lock";

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
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = String(ctx.body?.email ?? "")
        .trim()
        .toLowerCase();
      const user = await db.user.findUnique({
        where: { email },
        select: { lockedUntil: true, status: true },
      });
      if (user?.lockedUntil && user.lockedUntil > new Date()) {
        throw new APIError("FORBIDDEN", {
          code: "ACCOUNT_LOCKED",
          message: `Akun dikunci ${LOCK_MINUTES} menit karena terlalu banyak percobaan masuk`,
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
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, failedLoginCount: true },
      });
      if (!user) return;
      if (failed) {
        await db.user.update({
          where: { id: user.id },
          data: nextLoginFailure(user.failedLoginCount, new Date()),
        });
      } else if (!(returned instanceof APIError) && user.failedLoginCount > 0) {
        await db.user.update({
          where: { id: user.id },
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
          },
        }
      : undefined,
  // nextCookies harus menjadi plugin terakhir.
  plugins: [
    emailOTP({
      otpLength: OTP_LENGTH,
      expiresIn: 10 * 60,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "email-verification") return;
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
