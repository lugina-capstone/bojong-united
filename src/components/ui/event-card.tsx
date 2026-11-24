import { cn } from "@/lib/utils";
import { CalendarDaysIcon, CircleCheckIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { OrgLogo } from "@/components/ui/org-logo";

type CoverTone = "blue" | "peach" | "sage" | "lilac" | "sand" | "slate";

const COVER: Record<CoverTone, string> = {
  blue: "bg-primary-100 text-primary-600",
  peach: "bg-tone-peach-bg text-tone-peach-fg",
  sage: "bg-tone-sage-bg text-tone-sage-fg",
  lilac: "bg-tone-lilac-bg text-tone-lilac-fg",
  sand: "bg-tone-sand-bg text-tone-sand-fg",
  slate: "bg-tone-slate-bg text-tone-slate-fg",
};

type EventStatus = "upcoming" | "ongoing" | "finished";

const STATUS: Record<EventStatus, { label: string; className: string }> = {
  upcoming: {
    label: "Belum dimulai",
    className: "bg-primary-50 text-primary-600",
  },
  ongoing: {
    label: "Berlangsung",
    className: "bg-success-50 text-success-700",
  },
  finished: { label: "Selesai", className: "bg-muted text-muted-foreground" },
};

/** Kartu acara di Jelajah, Beranda, dan Daftar Acara. Label "Tim" untuk acara tim. */
function EventCard({
  title,
  field,
  organization,
  organizationLogo,
  period,
  status,
  isTeam,
  joined,
  enrollmentNote,
  coverTone = "blue",
  className,
}: {
  title: string;
  field: string;
  organization: string;
  organizationLogo?: string | null;
  period: string;
  status: EventStatus;
  isTeam?: boolean;
  joined?: boolean;
  enrollmentNote?: string;
  coverTone?: CoverTone;
  className?: string;
}) {
  return (
    <article
      data-slot="event-card"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-34 flex-col justify-center gap-3 p-5",
          COVER[coverTone],
        )}
      >
        <div className="flex items-center gap-2.5">
          <p className="min-w-0 flex-1 truncate text-overline">{field}</p>
          {isTeam && (
            <Badge tone="neutral" className="bg-card/70">
              <UsersIcon aria-hidden="true" />
              Tim
            </Badge>
          )}
        </div>
        <h3 className="line-clamp-2 text-display">{title}</h3>
      </div>
      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex min-w-0 items-center gap-2">
          <OrgLogo name={organization} src={organizationLogo} size="sm" />
          <p className="truncate text-small-strong text-foreground">
            {organization}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-caption text-tone-slate-fg">
          <CalendarDaysIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{period}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-sm px-2.5 py-1 text-caption-strong",
              STATUS[status].className,
            )}
          >
            {STATUS[status].label}
          </span>
          {joined ? (
            <span className="ml-auto flex items-center gap-1.25 text-caption text-success-600">
              <CircleCheckIcon aria-hidden="true" className="size-3.5" />
              Sudah diikuti
            </span>
          ) : (
            enrollmentNote && (
              <span className="ml-auto truncate text-caption text-subtle">
                {enrollmentNote}
              </span>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export { EventCard, type EventStatus, type CoverTone };
