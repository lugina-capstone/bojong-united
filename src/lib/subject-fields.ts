import "server-only";

import { db } from "@/lib/db";

export type SubjectFieldOption = { id: string; name: string; custom: boolean };

/** Bidang bawaan (urutan Figma) lalu bidang milik organisasi menurut nama. */
export async function subjectFieldOptions(
  organizationId: string,
): Promise<SubjectFieldOption[]> {
  const fields = await db.subjectField.findMany({
    where: { OR: [{ organizationId }, { organizationId: null }] },
    orderBy: [
      { organizationId: { sort: "asc", nulls: "first" } },
      { position: "asc" },
      { name: "asc" },
    ],
    select: { id: true, name: true, organizationId: true },
  });
  return fields.map((field) => ({
    id: field.id,
    name: field.name,
    custom: field.organizationId !== null,
  }));
}
