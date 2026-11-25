import type { Metadata } from "next";

import { MaterialWizardPage } from "@/app/(app)/ruang-kerja/materi/_wizard/wizard-page";

export const metadata: Metadata = { title: "Unggah materi" };

export default function NewMaterialPage() {
  return <MaterialWizardPage materialId={null} step={1} />;
}
