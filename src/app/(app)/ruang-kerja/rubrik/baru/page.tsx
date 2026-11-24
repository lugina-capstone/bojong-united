import type { Metadata } from "next";

import { rubricFields } from "@/app/(app)/ruang-kerja/rubrik/_components/load-rubric";
import { RubricEditor } from "@/app/(app)/ruang-kerja/rubrik/_components/rubric-editor";
import { PageHeader } from "@/components/ui/page-header";
import { requireTeacher } from "@/lib/teacher-access";

export const metadata: Metadata = { title: "Buat rubrik" };

export default async function NewRubricPage() {
  const { organizationId } = await requireTeacher();
  const fields = await rubricFields(organizationId);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rubrik penilaian"
        title="Buat rubrik"
        description="Tanpa bobot: semua kriteria bernilai setara dan dinilai dengan skala 1–5."
      />
      <RubricEditor fields={fields} cancelHref="/ruang-kerja/rubrik" />
    </div>
  );
}
