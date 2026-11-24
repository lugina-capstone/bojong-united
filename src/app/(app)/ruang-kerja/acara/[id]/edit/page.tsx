import type { Metadata } from "next";

import { WizardPage } from "@/app/(app)/ruang-kerja/acara/_wizard/wizard-page";

export const metadata: Metadata = { title: "Lanjutkan draf acara" };

export default async function EditEventPage({
  params,
  searchParams,
}: PageProps<"/ruang-kerja/acara/[id]/edit">) {
  const { id } = await params;
  const { step } = await searchParams;
  return <WizardPage eventId={id} step={Number(step) || 0} />;
}
