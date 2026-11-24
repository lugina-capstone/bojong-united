import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

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
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendLinkEmail(
        user.email,
        "Verifikasi email Becraft",
        "Klik tautan berikut untuk memverifikasi email Anda",
        url,
      );
    },
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
  plugins: [nextCookies()],
});
