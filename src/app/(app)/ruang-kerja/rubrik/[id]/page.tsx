import { CalendarIcon, LockIcon, PencilIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteRubricButton } from "@/app/(app)/ruang-kerja/rubrik/_components/delete-rubric-button";

import { SectionCard } from "@/app/(app)/_components/section-card";
import { CopyRubricButton } from "@/app/(app)/ruang-kerja/rubrik/_components/copy-rubric-button";
import { loadRubric } from "@/app/(app)/ruang-kerja/rubrik/_components/load-rubric";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SCORE_LEVELS } from "@/components/ui/score-level";
import { formatDate } from "@/lib/format";
import { eventPhaseLabels } from "@/lib/event-rules";
import { PageHeader } from "@/components/ui/page-header";
import { canManageRubric } from "@/lib/rubric-access";
import { requireTeacher } from "@/lib/teacher-access";

export const metadata: Metadata = { title: "Detail rubrik" };

const LEVELS = ["level1", "level2", "level3", "level4", "level5"] as const;

export default async function RubricDetailPage({
  params,
}: PageProps<"/ruang-kerja/rubrik/[id]">) {
  const { id } = await params;
  const { user, organizationId } = await requireTeacher();
  const rubric = await loadRubric(id, organizationId);
  if (!rubric) notFound();

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/rubrik" className="hover:text-foreground">
          Rubrik Penilaian
        </Link>{" "}
        / {rubric.title}
      </nav>
      <PageHeader
        eyebrow={`Rubrik penilaian · ${rubric.field.name}`}
        title={
          rubric.version > 1
            ? `${rubric.title} (v${rubric.version})`
            : rubric.title
        }
        description={rubric.description ?? undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <CopyRubricButton rubricId={rubric.id} size="md" />
            {canManageRubric(rubric, user) && (
              <>
                {rubric.locked && (
                  <DeleteRubricButton
                    rubricId={rubric.id}
                    title={rubric.title}
                    usedInEvents={rubric.milestones.length}
                  />
                )}
                <Link
                  href={`/ruang-kerja/rubrik/${rubric.id}/edit`}
                  className={buttonVariants()}
                >
                  <PencilIcon aria-hidden="true" />
                  {rubric.locked ? "Buat versi baru" : "Edit rubrik"}
                </Link>
              </>
            )}
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2 text-small text-muted-foreground">
        {rubric.locked ? (
          <Badge tone="warning">
            <LockIcon aria-hidden="true" />
            Terkunci · sudah dipakai acara terbit
          </Badge>
        ) : (
          <Badge tone="success">
            <PencilIcon aria-hidden="true" />
            Dapat diedit
          </Badge>
        )}
        <span>
          {rubric.criteria.length} kriteria · skor maks.{" "}
          {rubric.criteria.length * 5} · dibuat {rubric.creator.name} ·
          diperbarui {formatDate(rubric.updatedAt)}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {rubric.criteria.map((criterion, index) => (
            <SectionCard
              key={criterion.id}
              title={`${index + 1}. ${criterion.name}`}
              description={criterion.description ?? undefined}
            >
              <ol className="grid grid-cols-1 gap-2 px-4 pb-5 sm:grid-cols-5 sm:px-5">
                {LEVELS.map((key, level) => (
                  <li
                    key={key}
                    className="flex flex-col gap-1 rounded-lg border border-border p-3"
                  >
                    <span className="text-caption-strong text-primary-600">
                      {level + 1} · {SCORE_LEVELS[(level + 1) as 1].label}
                    </span>
                    <span className="text-small text-label">
                      {criterion[key]}
                    </span>
                  </li>
                ))}
              </ol>
            </SectionCard>
          ))}
        </div>
        <SectionCard
          title="Dipakai di acara"
          className="xl:self-start"
          description={
            rubric.events.length === 0
              ? "Belum dipakai di acara mana pun."
              : `${rubric.events.length} acara memakai rubrik ini.`
          }
        >
          <ul className="flex flex-col gap-2 px-4 pb-5 sm:px-5">
            {rubric.events.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-2 text-small text-label"
              >
                <CalendarIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{event.title}</span>
                <Badge tone="neutral">
                  {event.status === "DRAFT"
                    ? eventPhaseLabels.draft
                    : event.status === "ARCHIVED"
                      ? eventPhaseLabels.archived
                      : event.status === "CLOSED"
                        ? eventPhaseLabels.finished
                        : "Terbit"}
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
