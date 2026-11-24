import { notFound } from "next/navigation";

import { EventWizard } from "@/app/(app)/ruang-kerja/acara/_wizard/event-wizard";
import { loadWizard } from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { roleLabels } from "@/lib/rbac";
import { requireTeacher } from "@/lib/teacher-access";

/** Halaman wizard bersama untuk acara baru dan lanjutkan draf. */
async function WizardPage({
  eventId,
  step,
}: {
  eventId: string | null;
  step: number;
}) {
  const { user, organizationId } = await requireTeacher();
  const data = await loadWizard({
    organizationId,
    userId: user.id,
    userName: user.name,
    roleLabel: roleLabels[user.role],
    eventId,
  });
  if (!data) notFound();
  const maxStep = eventId ? Math.min(5, data.draftStep) : 1;
  const current = Math.min(Math.max(1, step || maxStep), maxStep);
  return (
    <EventWizard key={`${eventId}-${current}`} data={data} step={current} />
  );
}

export { WizardPage };
