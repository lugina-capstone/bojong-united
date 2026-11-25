import "server-only";

import { db } from "@/lib/db";
import { lockedRubricWhere } from "@/lib/rubric-access";

/** Bidang bawaan + bidang organisasi untuk form rubrik. */
export function rubricFields(organizationId: string) {
  return db.subjectField.findMany({
    where: { OR: [{ organizationId }, { organizationId: null }] },
    orderBy: [
      { organizationId: { sort: "asc", nulls: "first" } },
      { name: "asc" },
    ],
    select: { id: true, name: true },
  });
}

/** Rubrik organisasi beserta kriteria, status terkunci, dan acara pemakai. */
export async function loadRubric(id: string, organizationId: string) {
  const rubric = await db.rubric.findFirst({
    where: { id, organizationId, archivedAt: null },
    include: {
      field: { select: { name: true } },
      creator: { select: { name: true } },
      criteria: { orderBy: { order: "asc" } },
      milestones: {
        select: { event: { select: { id: true, title: true, status: true } } },
      },
    },
  });
  if (!rubric) return null;
  const locked =
    (await db.rubric.count({ where: { AND: [{ id }, lockedRubricWhere] } })) >
    0;
  const events = [
    ...new Map(rubric.milestones.map((m) => [m.event.id, m.event])).values(),
  ];
  return { ...rubric, locked, events };
}
