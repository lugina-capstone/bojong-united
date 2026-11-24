import type { Metadata } from "next";

import { WizardPage } from "@/app/(app)/ruang-kerja/acara/_wizard/wizard-page";

export const metadata: Metadata = { title: "Buat acara" };

export default function NewEventPage() {
  return <WizardPage eventId={null} step={1} />;
}
