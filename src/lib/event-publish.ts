import "server-only";

import { db } from "@/lib/db";

/** Daftar hal yang belum lengkap sebelum acara bisa diterbitkan. */
export async function publishIssues(eventId: string) {
  const event = await db.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { milestones: true },
  });
  const issues: string[] = [];
  if (!event.fieldId) issues.push("Bidang acara belum dipilih.");
  if (!event.startsAt || !event.endsAt)
    issues.push("Periode acara belum diisi.");
  if (event.milestones.length === 0) issues.push("Belum ada milestone.");
  const { startsAt, endsAt } = event;
  if (
    startsAt &&
    endsAt &&
    event.milestones.some(
      (m) => !m.dueAt || m.dueAt < startsAt || m.dueAt > endsAt,
    )
  )
    issues.push("Tenggat milestone harus berada dalam periode acara.");
  if (event.milestones.some((m) => !m.rubricId))
    issues.push("Ada milestone tanpa rubrik.");
  if (event.certificateEnabled && !event.certificateTitle)
    issues.push("Rincian sertifikat belum lengkap.");
  return issues;
}
