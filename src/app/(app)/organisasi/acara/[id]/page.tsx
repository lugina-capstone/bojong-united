import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionCard } from "@/app/(app)/_components/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { requireOrganizationAdmin } from "@/lib/organization-access";

export const metadata: Metadata = { title: "Detail acara organisasi" };

const STATUS = {
  PUBLISHED: { label: "Aktif", tone: "success" },
  CLOSED: { label: "Selesai", tone: "primary" },
  ARCHIVED: { label: "Diarsipkan", tone: "neutral" },
} as const;

/** Ringkasan baca-saja sebuah acara untuk Admin Organisasi. */
export default async function OrganizationEventPage({
  params,
}: PageProps<"/organisasi/acara/[id]">) {
  const { organizationId } = await requireOrganizationAdmin("member:manage");
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, organizationId, status: { not: "DRAFT" } },
    select: {
      title: true,
      description: true,
      status: true,
      startsAt: true,
      endsAt: true,
      participantType: true,
      kkm: true,
      creator: { select: { name: true } },
      transferredFrom: { select: { name: true } },
      field: { select: { name: true } },
      milestones: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, title: true, dueAt: true },
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!event || event.status === "DRAFT") notFound();
  const status = STATUS[event.status];

  const facts = [
    { label: "Pengelola", value: event.creator.name },
    ...(event.transferredFrom
      ? [{ label: "Dialihkan dari", value: event.transferredFrom.name }]
      : []),
    { label: "Bidang", value: event.field?.name ?? "-" },
    {
      label: "Jenis peserta",
      value: event.participantType === "TEAM" ? "Tim" : "Individu",
    },
    { label: "Peserta", value: formatNumber(event._count.enrollments) },
    { label: "KKM", value: String(event.kkm) },
    {
      label: "Mulai",
      value: event.startsAt ? formatDate(event.startsAt) : "-",
    },
    { label: "Selesai", value: event.endsAt ? formatDate(event.endsAt) : "-" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Acara organisasi"
        title={event.title}
        description={event.description ?? undefined}
        actions={
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/organisasi/acara" />}
          >
            <ArrowLeftIcon aria-hidden="true" />
            Kembali
          </Button>
        }
      />
      <SectionCard
        title="Ringkasan"
        action={<Badge tone={status.tone}>{status.label}</Badge>}
        bodyClassName="px-4 pb-5 sm:px-5"
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-small text-muted-foreground">{fact.label}</dt>
              <dd className="text-body-strong break-words text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>
      <SectionCard
        title="Milestone"
        description="Tugas dan penilaian dikelola oleh pengelola acara."
        bodyClassName="px-4 pb-5 sm:px-5"
      >
        {event.milestones.length === 0 ? (
          <p className="text-body text-muted-foreground">
            Belum ada milestone.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {event.milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="text-body-medium text-foreground">
                  {milestone.order}. {milestone.title}
                </span>
                <span className="text-small text-muted-foreground">
                  {milestone.dueAt
                    ? `Tenggat ${formatDate(milestone.dueAt)}`
                    : "Tanpa tenggat"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  );
}
