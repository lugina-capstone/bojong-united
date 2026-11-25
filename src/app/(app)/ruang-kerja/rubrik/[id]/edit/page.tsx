import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  loadRubric,
  rubricFields,
} from "@/app/(app)/ruang-kerja/rubrik/_components/load-rubric";
import { DeleteRubricButton } from "@/app/(app)/ruang-kerja/rubrik/_components/delete-rubric-button";
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
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/rubrik" className="hover:text-foreground">
          Rubrik Penilaian
        </Link>{" "}
        /{" "}
        <Link
          href={`/ruang-kerja/rubrik/${rubric.id}`}
          className="hover:text-foreground"
        >
          {rubric.title}
        </Link>{" "}
        / Edit
      </nav>
      <PageHeader
        eyebrow={rubric.title}
        title="Edit rubrik"
        description="Tanpa bobot: semua kriteria bernilai setara. Perubahan langsung terlihat pada pratinjau."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={rubric.locked ? "warning" : "success"}>
              {rubric.locked
                ? "Terkunci · disimpan sebagai versi baru"
                : "Dapat diedit · belum dipakai menilai"}
            </Badge>
            <DeleteRubricButton
              rubricId={rubric.id}
              title={rubric.title}
              usedInEvents={rubric.milestones.length}
            />
          </div>
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
