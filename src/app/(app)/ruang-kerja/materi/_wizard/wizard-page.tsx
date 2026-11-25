import { notFound } from "next/navigation";

import { loadMaterialWizard } from "@/app/(app)/ruang-kerja/materi/_wizard/load";
import { MaterialWizard } from "@/app/(app)/ruang-kerja/materi/_wizard/material-wizard";
import { requireTrainer } from "@/lib/material-access";

/** Halaman wizard materi untuk materi baru, lanjutkan draf, dan edit materi. */
async function MaterialWizardPage({
  materialId,
  step,
}: {
  materialId: string | null;
  step: number;
}) {
  const { user, organizationId } = await requireTrainer();
  const data = await loadMaterialWizard({
    organizationId,
    userId: user.id,
    userName: user.name,
    materialId,
  });
  if (!data) notFound();
  const maxStep = materialId ? Math.min(3, data.draftStep) : 1;
  const current = Math.min(Math.max(1, step || maxStep), maxStep);
  return (
    <MaterialWizard
      key={`${materialId}-${current}`}
      data={data}
      step={current}
    />
  );
}

export { MaterialWizardPage };
