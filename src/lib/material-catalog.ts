import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { materialCover } from "@/lib/material-rules";
import { logoUrlOf } from "@/lib/organization-access";

/** Data kartu materi untuk Peserta, termasuk progres enrollment miliknya. */
export async function materialCardsFor(
  userId: string,
  where: Prisma.MaterialWhereInput,
  page?: { skip: number; take: number },
) {
  const materials = await db.material.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    ...(page ?? {}),
    include: {
      category: { select: { name: true } },
      trainer: { select: { name: true } },
      organization: {
        select: {
          name: true,
          logo: { select: { key: true, name: true, contentType: true } },
        },
      },
      sections: { select: { durationMinutes: true } },
      enrollments: {
        where: { userId },
        select: { progress: true, completedAt: true },
      },
      _count: { select: { enrollments: true } },
    },
  });
  return Promise.all(
    materials.map(async (m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? "",
      category: m.category.name,
      trainer: m.trainer.name,
      organization: m.organization.name,
      logoUrl: await logoUrlOf(m.organization.logo),
      sections: m.sections.length,
      minutes: m.sections.reduce((s, x) => s + (x.durationMinutes ?? 0), 0),
      learners: m._count.enrollments,
      cover: materialCover(m.coverColor),
      level: m.level,
      enrollment: m.enrollments[0] ?? null,
    })),
  );
}

export type MaterialCardData = Awaited<
  ReturnType<typeof materialCardsFor>
>[number];
