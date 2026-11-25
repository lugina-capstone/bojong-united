import {
  ArrowUpRightIcon,
  BookOpenIcon,
  LayersIcon,
  PencilIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SectionCard } from "@/app/(app)/_components/section-card";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { buttonVariants } from "@/components/ui/button";
import { MilestoneCard } from "@/components/ui/milestone-card";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { eventPhase } from "@/lib/event-rules";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireOwnEvent } from "@/lib/teacher-access";
import { formatLabels } from "@/lib/validations/event";

export const metadata: Metadata = { title: "Detail acara" };

export default async function EventDetailPage({
  params,
}: PageProps<"/ruang-kerja/acara/[id]">) {
  const { id } = await params;
  const { event: base } = await requireOwnEvent(id);
  if (base.status === "DRAFT") {
    redirect(`/ruang-kerja/acara/${id}/edit?step=${base.draftStep}`);
  }
  const event = await db.event.findUniqueOrThrow({
    where: { id },
    include: {
      field: { select: { name: true } },
      organization: { select: { name: true } },
      creator: { select: { name: true } },
      materials: {
        select: {
          material: {
            select: {
              id: true,
              title: true,
              level: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      milestones: {
        orderBy: { order: "asc" },
        include: {
          rubric: { select: { id: true, title: true } },
          survey: { select: { id: true } },
        },
      },
      _count: { select: { enrollments: true, teams: true } },
    },
  });
  const phase = eventPhase(event);
  const rows: [string, string][] = [
    ["Bidang", event.field?.name ?? "–"],
    [
      "Periode",
      event.startsAt && event.endsAt
        ? `${formatDate(event.startsAt)} – ${formatDate(event.endsAt)}`
        : "–",
    ],
    [
      "Jenis peserta",
      event.participantType === "TEAM"
        ? `Tim · maks ${event.maxTeamMembers ?? "–"} anggota`
        : "Individu",
    ],
    ["KKM", String(event.kkm)],
    [
      "Sertifikat",
      event.certificateEnabled
        ? (event.certificateTitle ?? "Aktif")
        : "Tidak aktif",
    ],
    ["Penyelenggara", `${event.organization.name} · ${event.creator.name}`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/acara" className="hover:text-foreground">
          Acara Saya
        </Link>{" "}
        / {event.title}
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <PhaseBadge phase={phase} />
          <h1 className="text-display break-words text-foreground">
            {event.title}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {event.status === "PUBLISHED" && (
            <Link
              href={`/ruang-kerja/acara/${id}/ubah`}
              className={buttonVariants({ variant: "secondary" })}
            >
              <PencilIcon aria-hidden="true" />
              Edit acara
            </Link>
          )}
          <Link href={`/ruang-kerja/tugas/${id}`} className={buttonVariants()}>
            Pantau progres
            <ArrowUpRightIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={UsersIcon}
          label="Peserta"
          value={event._count.enrollments}
        />
        <StatCard
          icon={LayersIcon}
          label="Milestone"
          value={event.milestones.length}
        />
        <StatCard
          icon={UsersRoundIcon}
          label={
            event.participantType === "TEAM" ? "Kelompok" : "Materi pendukung"
          }
          value={
            event.participantType === "TEAM"
              ? event._count.teams
              : event.materials.length
          }
        />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            title="Informasi acara"
            bodyClassName="px-4 pb-5 sm:px-5"
          >
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-caption text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-small-strong break-words text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {event.description && (
              <p className="mt-4 text-small whitespace-pre-line text-label">
                {event.description}
              </p>
            )}
            {event.guidelines && (
              <div className="mt-4 flex flex-col gap-1">
                <h3 className="text-small-strong text-foreground">
                  Arahan untuk peserta
                </h3>
                <p className="text-small whitespace-pre-line text-label">
                  {event.guidelines}
                </p>
              </div>
            )}
          </SectionCard>
          <SectionCard
            title="Milestone dan rubrik"
            bodyClassName="gap-3 px-4 pb-5 sm:px-5"
          >
            {event.milestones.map((m) => (
              <MilestoneCard
                key={m.id}
                order={m.order}
                title={m.title}
                description={m.instructions || undefined}
                deadline={m.dueAt ? formatDateTime(m.dueAt) : "–"}
                formats={m.formats.map((f) => formatLabels[f])}
                hasSurvey={Boolean(m.survey)}
                status={
                  m.rubric ? (
                    <Link
                      href={`/ruang-kerja/rubrik/${m.rubric.id}`}
                      className="text-caption text-primary-600 hover:underline"
                    >
                      Rubrik: {m.rubric.title}
                    </Link>
                  ) : (
                    <span className="text-caption text-muted-foreground">
                      Rubrik belum dipilih
                    </span>
                  )
                }
              />
            ))}
          </SectionCard>
        </div>
        <aside className="flex flex-col gap-4 xl:self-start">
          <SectionCard
            title="Materi pendukung"
            bodyClassName="gap-2 px-4 pb-5 sm:px-5"
          >
            {event.materials.length === 0 ? (
              <p className="text-small text-muted-foreground">
                Tidak ada materi pendukung.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {event.materials.map(({ material }) => (
                  <li
                    key={material.id}
                    className="flex items-start gap-2 text-small"
                  >
                    <BookOpenIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary-500"
                    />
                    <span>
                      <span className="block text-small-strong text-foreground">
                        {material.title}
                      </span>
                      <span className="block text-caption text-muted-foreground">
                        {material.category.name}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          <SectionCard
            title="Hasil acara"
            bodyClassName="gap-2 px-4 pb-5 sm:px-5"
          >
            <Link
              href={`/ruang-kerja/tugas/${id}/rekap`}
              className="text-small text-primary-600 hover:underline"
            >
              Rekap akhir
            </Link>
            <Link
              href={`/ruang-kerja/galeri/${id}`}
              className="text-small text-primary-600 hover:underline"
            >
              Galeri karya
            </Link>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
