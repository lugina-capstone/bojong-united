import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";

/** Trainer aktif beserta organisasinya. */
export async function requireTrainer() {
  const user = await requirePermission("material:manage");
  return { user, organizationId: user.membership!.organization.id };
}

/** Materi milik Trainer yang sedang login; 404 jika bukan miliknya. */
export async function requireOwnMaterial(materialId: string) {
  const ctx = await requireTrainer();
  const material = await db.material.findFirst({
    where: {
      id: materialId,
      organizationId: ctx.organizationId,
      trainerId: ctx.user.id,
    },
  });
  if (!material) notFound();
  return { ...ctx, material };
}

/** Materi yang bisa ditemukan Peserta: terbit dan organisasinya aktif. */
export const visibleMaterialWhere = {
  status: "PUBLISHED" as const,
  organization: { status: "APPROVED" as const },
};
