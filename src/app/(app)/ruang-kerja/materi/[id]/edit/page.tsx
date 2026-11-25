import type { Metadata } from "next";

import { MaterialWizardPage } from "@/app/(app)/ruang-kerja/materi/_wizard/wizard-page";

export const metadata: Metadata = { title: "Edit materi" };

export default async function EditMaterialPage({
  params,
  searchParams,
}: PageProps<"/ruang-kerja/materi/[id]/edit">) {
  const { id } = await params;
  const { step } = await searchParams;
  return <MaterialWizardPage materialId={id} step={Number(step) || 0} />;
}
