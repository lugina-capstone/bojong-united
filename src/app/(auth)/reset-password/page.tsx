import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/app/(auth)/lupa-password/forgot-password-form";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Atur ulang kata sandi" };

/** Email pemilik token reset yang masih berlaku, atau null (format token mengikuti Better Auth). */
async function emailForResetToken(token: string) {
  const verification = await db.verification.findFirst({
    where: {
      identifier: `reset-password:${token}`,
      expiresAt: { gt: new Date() },
    },
    select: { value: true },
  });
  if (!verification) return null;
  const user = await db.user.findUnique({
    where: { id: verification.value },
    select: { email: true },
  });
  return user?.email ?? null;
}

async function ResetContent({ searchParams }: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;
  // Masa berlaku token dibandingkan dengan waktu request, bukan waktu prerender.
  await connection();
  const email =
    typeof token === "string" && !error
      ? await emailForResetToken(token)
      : null;
  if (typeof token !== "string" || !email)
    return <ForgotPasswordForm expired />;
  return <ResetPasswordForm token={token} email={email} />;
}

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <Suspense>
      <ResetContent {...props} />
    </Suspense>
  );
}
