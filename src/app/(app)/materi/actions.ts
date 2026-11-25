"use server";

import { refresh } from "next/cache";

import { db } from "@/lib/db";
import { visibleMaterialWhere } from "@/lib/material-access";
import { materialProgress, shouldNotifyEnrollment } from "@/lib/material-rules";
import { notify } from "@/lib/notifications";
import { requirePermission } from "@/lib/session";

export type LearnActionState = {
  ok?: boolean;
  error?: string;
  progress?: number;
  completed?: boolean;
};

/** Ikuti materi publik, atau materi yang dilampirkan ke acara yang diikuti. */
export async function enrollMaterialAction(
  materialId: string,
): Promise<LearnActionState> {
  const user = await requirePermission("material:enroll");
  const material = await db.material.findFirst({
    where: {
      id: materialId,
      ...visibleMaterialWhere,
      OR: [
        { visibility: "PUBLIC" },
        {
          events: {
            some: { event: { enrollments: { some: { userId: user.id } } } },
          },
        },
      ],
    },
    select: { id: true, title: true, trainerId: true },
  });
  if (!material) return { error: "Materi tidak ditemukan." };
  const existing = await db.materialEnrollment.findUnique({
    where: { materialId_userId: { materialId, userId: user.id } },
    select: { id: true },
  });
  if (existing) return { ok: true };
  await db.materialEnrollment.create({
    data: { materialId, userId: user.id },
  });
  const count = await db.materialEnrollment.count({ where: { materialId } });
  if (shouldNotifyEnrollment(count)) {
    await notify([material.trainerId], "material.enrolled", {
      materialId,
      materialTitle: material.title,
      count: String(count),
    });
  }
  refresh();
  return { ok: true, progress: 0 };
}

/** Tandai satu bagian selesai lalu perbarui progres dan riwayat belajar. */
export async function completeSectionAction(
  materialId: string,
  sectionId: string,
): Promise<LearnActionState> {
  const user = await requirePermission("material:enroll");
  const enrollment = await db.materialEnrollment.findUnique({
    where: { materialId_userId: { materialId, userId: user.id } },
    include: { material: { select: { title: true, status: true } } },
  });
  if (!enrollment || enrollment.material.status === "DRAFT") {
    return { error: "Ikuti materi ini terlebih dahulu." };
  }
  const section = await db.materialSection.findFirst({
    where: { id: sectionId, materialId },
    select: { id: true },
  });
  if (!section) return { error: "Bagian tidak ditemukan." };
  await db.materialSectionProgress.upsert({
    where: {
      enrollmentId_sectionId: { enrollmentId: enrollment.id, sectionId },
    },
    create: { enrollmentId: enrollment.id, sectionId },
    update: {},
  });
  const [done, total] = await Promise.all([
    db.materialSectionProgress.count({
      where: { enrollmentId: enrollment.id },
    }),
    db.materialSection.count({ where: { materialId } }),
  ]);
  const progress = materialProgress(done, total);
  const completed = progress === 100;
  const firstCompletion = completed && !enrollment.completedAt;
  await db.materialEnrollment.update({
    where: { id: enrollment.id },
    data: {
      progress,
      completedAt: firstCompletion ? new Date() : enrollment.completedAt,
    },
  });
  if (firstCompletion) {
    await notify([user.id], "material.completed", {
      materialId,
      materialTitle: enrollment.material.title,
    });
  }
  refresh();
  return { ok: true, progress, completed };
}
