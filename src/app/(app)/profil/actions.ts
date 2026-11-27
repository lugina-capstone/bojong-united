"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lockAfterFailure, MAX_FAILED_LOGINS } from "@/lib/login-lock";
import { sniffImageType } from "@/lib/organization-rules";
import { deleteObject, readObjectHead } from "@/lib/storage";
import {
  avatarContentTypes,
  changePasswordSchema,
  MAX_AVATAR_SIZE,
  profileSchema,
} from "@/lib/validations/profile";

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

/** Simpan foto profil, nama lengkap, dan nomor HP Peserta, lalu kembali ke Profil. */
export async function updateProfileAction(
  input: unknown,
): Promise<ProfileFormState> {
  const user = await requireHomeRole(["PESERTA"]);
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const { name, phone, avatarFileId } = parsed.data;
  let previousAvatar: { id: string; key: string } | null = null;

  if (avatarFileId !== undefined) {
    const current = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { avatar: { select: { id: true, key: true } } },
    });
    previousAvatar = current.avatar;

    if (avatarFileId && avatarFileId !== previousAvatar?.id) {
      const file = await db.file.findFirst({
        where: { id: avatarFileId, ownerId: user.id, status: "UPLOADED" },
        select: {
          key: true,
          size: true,
          contentType: true,
          userAvatar: { select: { id: true } },
          organizationLogo: { select: { id: true } },
          milestoneAttachment: { select: { fileId: true } },
          submission: { select: { id: true } },
          submissionAttachment: { select: { submissionId: true } },
          submissionDraftFile: { select: { draftId: true } },
          materialSection: { select: { id: true } },
        },
      });
      const unused =
        file &&
        !file.userAvatar &&
        !file.organizationLogo &&
        !file.milestoneAttachment &&
        !file.submission &&
        !file.submissionAttachment &&
        !file.submissionDraftFile &&
        !file.materialSection;
      const valid =
        unused &&
        file.size <= MAX_AVATAR_SIZE &&
        (avatarContentTypes as readonly string[]).includes(file.contentType) &&
        sniffImageType(await readObjectHead(file.key, 8)) === file.contentType;
      if (!valid) {
        return {
          fieldErrors: {
            avatar: "Foto profil harus JPG atau PNG, maks. 2 MB.",
          },
        };
      }
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      phone,
      ...(avatarFileId !== undefined ? { avatarFileId } : {}),
    },
  });

  if (
    avatarFileId !== undefined &&
    previousAvatar &&
    previousAvatar.id !== avatarFileId
  ) {
    await db.file
      .delete({ where: { id: previousAvatar.id } })
      .catch(() => undefined);
    await deleteObject(previousAvatar.key).catch(() => undefined);
  }

  redirect("/profil?tersimpan=1");
}

const LOCKED_MESSAGE =
  "Terlalu banyak percobaan kata sandi salah. Coba lagi beberapa saat lagi.";

/** Tebakan kata sandi saat ini memakai hitungan dan kunci yang sama dengan login. */
async function recordFailedPassword(userId: string) {
  const { failedLoginCount } = await db.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true },
  });
  const lockedUntil = lockAfterFailure(failedLoginCount, new Date());
  if (!lockedUntil) return false;
  await db.user.updateMany({
    where: { id: userId, failedLoginCount: { gte: MAX_FAILED_LOGINS } },
    data: { failedLoginCount: 0, lockedUntil },
  });
  return true;
}

/** Ganti kata sandi akun manual; sesi di perangkat lain dikeluarkan. */
export async function changePasswordAction(
  input: unknown,
): Promise<ProfileFormState> {
  const user = await requireHomeRole(["PESERTA"]);
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const { lockedUntil } = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { lockedUntil: true },
  });
  if (lockedUntil && lockedUntil > new Date()) return { error: LOCKED_MESSAGE };
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
    if (!isAPIError(error)) throw error;
    if (error.body?.code !== "INVALID_PASSWORD")
      return { error: "Kata sandi tidak dapat diubah. Coba lagi." };
    return (await recordFailedPassword(user.id))
      ? { error: LOCKED_MESSAGE }
      : { fieldErrors: { currentPassword: "Kata sandi saat ini salah" } };
  }
  await db.user.updateMany({
    where: { id: user.id, failedLoginCount: { gt: 0 } },
    data: { failedLoginCount: 0 },
  });
  return { ok: true };
}
