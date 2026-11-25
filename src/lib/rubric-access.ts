import type { Prisma } from "@/generated/prisma/client";

/**
 * Rubrik terkunci: sudah dipakai menilai atau dipakai acara yang sudah terbit.
 * Perubahannya disimpan sebagai versi baru agar acara berjalan tidak berubah.
 */
export const lockedRubricWhere = {
  OR: [
    { criteria: { some: { scores: { some: {} } } } },
    { milestones: { some: { event: { status: { not: "DRAFT" } } } } },
  ],
} satisfies Prisma.RubricWhereInput;

/** Semua pengajar boleh melihat, menyalin, dan memakai; hanya pembuat dan admin yang mengubah. */
export function canManageRubric(
  rubric: { creatorId: string },
  user: { id: string; membership: { isAdmin: boolean } | null },
) {
  return rubric.creatorId === user.id || Boolean(user.membership?.isAdmin);
}
