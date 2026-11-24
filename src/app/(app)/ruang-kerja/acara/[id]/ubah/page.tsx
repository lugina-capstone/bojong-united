import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EditEventForm } from "@/app/(app)/ruang-kerja/acara/[id]/ubah/edit-form";
import { toLocalInput } from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { requireOwnEvent } from "@/lib/teacher-access";

export const metadata: Metadata = { title: "Edit acara" };

export default async function EditPublishedEventPage({
  params,
}: PageProps<"/ruang-kerja/acara/[id]/ubah">) {
  const { id } = await params;
  const { event } = await requireOwnEvent(id);
  if (event.status === "DRAFT") redirect(`/ruang-kerja/acara/${id}/edit`);
  if (event.status !== "PUBLISHED") redirect("/ruang-kerja/acara");
  const milestones = await db.milestone.findMany({
    where: { eventId: id },
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
      title: true,
      dueAt: true,
      _count: { select: { submissions: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Edit acara"
        title={event.title}
        description="Perubahan langsung terlihat oleh peserta. Bagian yang sudah berjalan terkunci."
      />
      <EditEventForm
        eventId={id}
        initial={{
          title: event.title,
          description: event.description ?? "",
          guidelines: event.guidelines ?? "",
          endsAt: toLocalInput(event.endsAt),
          minEndsAt: toLocalInput(event.endsAt),
        }}
        milestones={milestones.map((m) => ({
          id: m.id,
          order: m.order,
          title: m.title,
          dueAt: toLocalInput(m.dueAt),
          locked: m._count.submissions > 0,
        }))}
      />
    </div>
  );
}
