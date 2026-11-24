import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  loadRubric,
  rubricFields,
} from "@/app/(app)/ruang-kerja/rubrik/_components/load-rubric";
import { RubricEditor } from "@/app/(app)/ruang-kerja/rubrik/_components/rubric-editor";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { requireTeacher } from "@/lib/teacher-access";

export const metadata: Metadata = { title: "Edit rubrik" };

export default async function EditRubricPage({
  params,
}: PageProps<"/ruang-kerja/rubrik/[id]/edit">) {
  const { id } = await params;
  const { organizationId } = await requireTeacher();
  const [rubric, fields] = await Promise.all([
    loadRubric(id, organizationId),
    rubricFields(organizationId),
  ]);
  if (!rubric) notFound();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={rubric.title}
        title="Edit rubrik"
        description="Tanpa bobot: semua kriteria bernilai setara. Perubahan langsung terlihat pada pratinjau."
        actions={
          <Badge tone={rubric.locked ? "warning" : "success"}>
            {rubric.locked
              ? "Terkunci · disimpan sebagai versi baru"
              : "Dapat diedit · belum dipakai menilai"}
          </Badge>
        }
      />
      <RubricEditor
        rubricId={rubric.id}
        locked={rubric.locked}
        fields={fields}
        cancelHref={`/ruang-kerja/rubrik/${rubric.id}`}
        initial={{
          title: rubric.title,
          fieldId: rubric.fieldId,
          description: rubric.description ?? "",
          criteria: rubric.criteria.map((c) => ({
            name: c.name,
            description: c.description ?? "",
            level1: c.level1,
            level2: c.level2,
            level3: c.level3,
            level4: c.level4,
            level5: c.level5,
          })),
        }}
      />
    </div>
  );
}
