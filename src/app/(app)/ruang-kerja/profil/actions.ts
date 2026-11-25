"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { isUniqueViolation } from "@/lib/db-errors";
import { db } from "@/lib/db";
import { notifyOrganizationAdmins } from "@/lib/notifications";
import { requireUser } from "@/lib/session";

export type TrainerRequestState = { ok: boolean; error?: string };

const plannedMaterialSchema = z
  .string()
  .trim()
  .min(5, "Tulis materi yang akan diunggah (minimal 5 karakter)")
  .max(200, "Maksimal 200 karakter");

export async function requestTrainerAction(
  plannedMaterial: string,
): Promise<TrainerRequestState> {
  const user = await requireUser();
  const membership = user.membership;
  if (
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.role === "TRAINER"
  ) {
    return {
      ok: false,
      error: "Hanya Guru atau Asesor yang dapat mengajukan.",
    };
  }
  const parsed = plannedMaterialSchema.safeParse(plannedMaterial);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const organizationId = membership.organization.id;
  const pending = await db.trainerRequest.findFirst({
    where: { userId: user.id, organizationId, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    return { ok: false, error: "Pengajuan Anda masih menunggu persetujuan." };
  }
  try {
    await db.trainerRequest.create({
      data: { userId: user.id, organizationId, plannedMaterial: parsed.data },
    });
  } catch (error) {
    // Dua pengajuan bersamaan: index unik PENDING menolak yang kedua.
    if (!isUniqueViolation(error)) throw error;
    return { ok: false, error: "Pengajuan Anda masih menunggu persetujuan." };
  }
  await notifyOrganizationAdmins(
    organizationId,
    "trainer-request.submitted",
    { userName: user.name },
    user.id,
  );
  refresh();
  return { ok: true };
}

export async function cancelTrainerRequestAction(
  requestId: string,
): Promise<TrainerRequestState> {
  const user = await requireUser();
  const { count } = await db.trainerRequest.updateMany({
    where: { id: requestId, userId: user.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (count === 0) {
    return {
      ok: false,
      error: "Pengajuan tidak ditemukan atau sudah ditinjau.",
    };
  }
  refresh();
  return { ok: true };
}
