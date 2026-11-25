"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema, profileSchema } from "@/lib/validations/profile";

export type ProfileFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsOf(error: z.ZodError): ProfileFormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { fieldErrors };
}

/** Simpan nama lengkap dan nomor HP Peserta, lalu kembali ke Profil. */
export async function updateProfileAction(
  input: unknown,
): Promise<ProfileFormState> {
  const user = await requireHomeRole(["PESERTA"]);
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  redirect("/profil?tersimpan=1");
}

/** Ganti kata sandi akun manual; sesi di perangkat lain dikeluarkan. */
export async function changePasswordAction(
  input: unknown,
): Promise<ProfileFormState> {
  await requireHomeRole(["PESERTA"]);
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) {
      return error.body?.code === "INVALID_PASSWORD"
        ? { fieldErrors: { currentPassword: "Kata sandi saat ini salah" } }
        : { error: "Kata sandi tidak dapat diubah. Coba lagi." };
    }
    throw error;
  }
  return { ok: true };
}
