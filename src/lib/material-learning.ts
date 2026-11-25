import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";

/** Materi yang sudah diikuti Peserta beserta bagian dan progresnya; 404 jika belum diikuti. */
export async function loadLearning(materialId: string, userId: string) {
  const enrollment = await db.materialEnrollment.findUnique({
    where: { materialId_userId: { materialId, userId } },
    include: {
      sections: { select: { sectionId: true } },
      material: {
        include: {
          category: { select: { id: true, name: true } },
          trainer: { select: { name: true } },
          organization: { select: { name: true } },
          sections: {
            orderBy: { order: "asc" },
            include: {
              file: {
                select: { id: true, name: true, size: true, contentType: true },
              },
            },
          },
        },
      },
    },
  });
  if (!enrollment || enrollment.material.status === "DRAFT") notFound();
  const done = new Set(enrollment.sections.map((s) => s.sectionId));
  return { enrollment, material: enrollment.material, done };
}
