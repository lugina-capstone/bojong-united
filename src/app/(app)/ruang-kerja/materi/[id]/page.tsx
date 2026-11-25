import {
  BookOpenIcon,
  CalendarIcon,
  ChartLineIcon,
  CircleCheckIcon,
  GlobeIcon,
  PencilIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SectionCard } from "@/app/(app)/_components/section-card";
import { AttachDialog } from "@/app/(app)/ruang-kerja/materi/_components/attach-dialog";
import { MaterialDetailActions } from "@/app/(app)/ruang-kerja/materi/_components/material-menu";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { COVER_CLASS } from "@/lib/event-cover";
import { formatDate } from "@/lib/format";
import { requireOwnMaterial } from "@/lib/material-access";
import {
  materialCover,
  materialLevelLabels,
  materialProgress,
  sectionKind,
  sectionKindLabels,
} from "@/lib/material-rules";
import { KIND_ICON, KIND_TONE } from "@/lib/material-section-ui";
import { roleLabels } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail materi" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function MaterialDetailPage({
  params,
}: PageProps<"/ruang-kerja/materi/[id]">) {
  const { id } = await params;
  const { organizationId, material: base } = await requireOwnMaterial(id);
  if (base.status === "DRAFT") {
    redirect(`/ruang-kerja/materi/${id}/edit?step=${base.draftStep}`);
  }
  const [material, orgEvents] = await Promise.all([
    db.material.findUniqueOrThrow({
      where: { id },
      include: {
        category: { select: { name: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            file: { select: { contentType: true } },
            _count: { select: { progress: true } },
          },
        },
        enrollments: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            progress: true,
            completedAt: true,
            user: { select: { name: true } },
          },
        },
        events: {
          select: {
            event: {
              select: {
                id: true,
                title: true,
                creator: {
                  select: {
                    name: true,
                    membership: { select: { role: true } },
                  },
                },
                _count: { select: { enrollments: true } },
              },
            },
          },
        },
      },
    }),
    db.event.findMany({
      where: { organizationId, status: { in: ["DRAFT", "PUBLISHED"] } },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        title: true,
        creator: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);
  const learners = material.enrollments.length;
  const completed = material.enrollments.filter((e) => e.completedAt).length;
  const learning = learners - completed;
  const average =
    learners === 0
      ? 0
      : Math.round(
          material.enrollments.reduce((s, e) => s + e.progress, 0) / learners,
        );

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/materi" className="hover:text-foreground">
          Materi
        </Link>{" "}
        / {material.title}
      </nav>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl",
              COVER_CLASS[materialCover(material.coverColor)],
            )}
          >
            <BookOpenIcon aria-hidden="true" className="size-6" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-display break-words text-foreground">
              {material.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
              <Badge
                size="sm"
                tone={material.status === "PUBLISHED" ? "success" : "warning"}
              >
                <CircleCheckIcon aria-hidden="true" />
                {material.status === "PUBLISHED" ? "Terbit" : "Diarsipkan"}
              </Badge>
              <Badge size="sm" tone="primary">
                <GlobeIcon aria-hidden="true" />
                {material.visibility === "PUBLIC"
                  ? "Publik"
                  : "Hanya lewat acara"}
              </Badge>
              <Badge size="sm" tone="neutral">
                {materialLevelLabels[material.level]}
              </Badge>
              <span>
                {material.category.name} · {material.sections.length} bagian
                {material.publishedAt
                  ? ` · terbit ${formatDate(material.publishedAt)}`
                  : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/ruang-kerja/materi/${id}/edit?step=1`}
            className={buttonVariants({ variant: "secondary" })}
          >
            <PencilIcon aria-hidden="true" />
            Edit materi
          </Link>
          <MaterialDetailActions
            id={id}
            title={material.title}
            status={material.status}
            learners={learners}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersIcon} label="Peserta enroll" value={learners} />
        <StatCard icon={BookOpenIcon} label="Sedang belajar" value={learning} />
        <StatCard
          icon={CircleCheckIcon}
          label="Selesai"
          value={`${completed} · ${materialProgress(completed, learners)}%`}
        />
        <StatCard
          icon={ChartLineIcon}
          label="Rata-rata progres"
          value={`${average}%`}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <SectionCard
          title="Progres per bagian"
          description="Persentase peserta yang menandai bagian selesai"
          bodyClassName="gap-1 px-4 pb-5 sm:px-5"
        >
          <div className="flex flex-wrap gap-4 pb-2 text-caption text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success-500" />≥ 50%
              selesai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary-500" />
              &lt; 50% selesai
            </span>
          </div>
          <ol className="flex flex-col divide-y divide-border">
            {material.sections.map((s) => {
              const kind = sectionKind({
                fileContentType: s.file?.contentType,
                link: s.link,
              });
              const Icon = KIND_ICON[kind];
              const pct = materialProgress(s._count.progress, learners);
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        KIND_TONE[kind],
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-small-strong text-foreground">
                        {s.order}. {s.title}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {sectionKindLabels[kind]}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 sm:w-64">
                    <Progress value={pct} label={`Progres ${s.title}`} />
                    <span className="w-10 text-right text-small-strong text-foreground">
                      {pct}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </SectionCard>
        <aside className="flex flex-col gap-4 xl:self-start">
          <SectionCard
            title="Terlampir di acara"
            description={`${material.events.length} acara Guru/Asesor`}
            bodyClassName="gap-2 px-4 pb-5 sm:px-5"
          >
            {material.events.map(({ event }) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <CalendarIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary-500"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-small-strong text-foreground">
                    {event.title}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {event.creator.name}
                    {event.creator.membership
                      ? ` (${roleLabels[event.creator.membership.role]})`
                      : ""}{" "}
                    · {event._count.enrollments} peserta
                  </span>
                </span>
              </div>
            ))}
            {material.status === "PUBLISHED" && (
              <AttachDialog
                materialId={id}
                visibility={material.visibility}
                attached={material.events.map((e) => e.event.id)}
                events={orgEvents.map((e) => ({
                  id: e.id,
                  title: e.title,
                  meta: `${e.creator.name} · ${e._count.enrollments} peserta`,
                }))}
              />
            )}
          </SectionCard>
          <SectionCard
            title="Peserta terbaru"
            bodyClassName="gap-3 px-4 pb-5 sm:px-5"
          >
            {learners === 0 ? (
              <p className="text-small text-muted-foreground">
                Belum ada peserta yang mengikuti materi ini.
              </p>
            ) : (
              material.enrollments.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-caption-strong text-primary-600">
                    {initials(e.user.name)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-small-strong text-foreground">
                      {e.user.name}
                    </span>
                    {!e.completedAt && (
                      <Progress
                        value={e.progress}
                        label={`Progres ${e.user.name}`}
                      />
                    )}
                  </span>
                  {e.completedAt ? (
                    <Badge size="sm" tone="success">
                      Selesai
                    </Badge>
                  ) : (
                    <span className="text-small-strong text-foreground">
                      {e.progress}%
                    </span>
                  )}
                </div>
              ))
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
