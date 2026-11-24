import { ArrowUpRightIcon, PlayIcon } from "lucide-react";
import Link from "next/link";

import { EventMenu } from "@/app/(app)/ruang-kerja/acara/_components/event-menu";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { EventStatus } from "@/generated/prisma/enums";
import { COVER_CLASS, coverToneFor } from "@/lib/event-cover";
import { eventPhase, eventPhaseLabels } from "@/lib/event-rules";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const PHASE_TONE = {
  draft: "neutral",
  upcoming: "warning",
  ongoing: "success",
  finished: "neutral",
  archived: "neutral",
} as const;

export type ManagedEvent = {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  updatedAt: Date;
  draftStep: number;
  isTeam: boolean;
  field: string | null;
  milestoneCount: number;
  participantCount: number;
};

/** Kartu acara di Acara Saya: sampul berwarna, status, periode, dan menu kelola. */
function ManageEventCard({
  event,
  number,
}: {
  event: ManagedEvent;
  number: number;
}) {
  const phase = eventPhase(event);
  const isDraft = event.status === "DRAFT";
  const href = isDraft
    ? `/ruang-kerja/acara/${event.id}/edit?step=${event.draftStep}`
    : `/ruang-kerja/acara/${event.id}`;
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className={cn(
          "flex min-h-34 items-start gap-4 p-5",
          COVER_CLASS[coverToneFor(event.id)],
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="truncate text-overline">
            {event.field ?? "Bidang belum dipilih"}
          </p>
          <h2 className="line-clamp-2 text-display break-words">
            {event.title}
          </h2>
        </div>
        <span aria-hidden="true" className="text-display opacity-20">
          {String(number).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone={PHASE_TONE[phase]}>{eventPhaseLabels[phase]}</Badge>
          <span className="text-caption text-subtle">
            {event.milestoneCount} milestone ·{" "}
            {event.isTeam ? "Acara tim" : "Berurutan"}
            {!isDraft && ` · ${event.participantCount} peserta`}
          </span>
        </div>
        {event.description && (
          <p className="line-clamp-2 text-small text-muted-foreground">
            {event.description}
          </p>
        )}
        {isDraft ? (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between text-caption">
              <span className="text-caption-strong text-label">
                Langkah {event.draftStep} dari 5
              </span>
              <span className="text-subtle">
                {Math.round(((event.draftStep - 1) / 5) * 100)}% lengkap
              </span>
            </div>
            <Progress value={((event.draftStep - 1) / 5) * 100} />
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3">
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-overline text-subtle">Mulai</dt>
              <dd className="truncate text-small-medium text-foreground">
                {event.startsAt ? formatDateTime(event.startsAt) : "-"}
              </dd>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-overline text-subtle">Selesai</dt>
              <dd className="truncate text-small-medium text-foreground">
                {event.endsAt ? formatDateTime(event.endsAt) : "-"}
              </dd>
            </div>
          </dl>
        )}
        <div className="mt-auto flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-caption text-subtle">
            Diperbarui {formatDate(event.updatedAt)}
          </span>
          <Link
            href={href}
            className={buttonVariants({
              variant: isDraft ? "primary" : "link",
              size: "sm",
            })}
          >
            {isDraft ? "Lanjutkan" : "Lihat rincian"}
            {isDraft ? (
              <PlayIcon aria-hidden="true" />
            ) : (
              <ArrowUpRightIcon aria-hidden="true" />
            )}
          </Link>
          <EventMenu
            id={event.id}
            title={event.title}
            status={event.status}
            participantCount={event.participantCount}
            draftStep={event.draftStep}
          />
        </div>
      </div>
    </article>
  );
}

export { ManageEventCard };
