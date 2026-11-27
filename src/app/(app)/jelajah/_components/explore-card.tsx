import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CircleCheckIcon,
} from "lucide-react";
import Link from "next/link";

import { orgTypeLabel } from "@/app/(app)/_components/badges";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { buttonVariants } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
import type { OrganizationType } from "@/generated/prisma/enums";
import { COVER_CLASS, coverToneFor } from "@/lib/event-cover";
import type { EventPhase } from "@/lib/event-rules";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Kartu acara di Jelajah: sampul, penyelenggara, status, dan tombol detail. */
function ExploreCard({
  event,
  phase,
  joined,
  logoUrl,
}: {
  event: {
    id: string;
    title: string;
    description: string | null;
    participantType: "INDIVIDUAL" | "TEAM";
    maxTeamMembers: number | null;
    certificateEnabled: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    field: { name: string } | null;
    creator: { name: string };
    organization: { name: string; type: OrganizationType };
    _count: { milestones: number };
  };
  phase: EventPhase;
  joined: boolean;
  logoUrl: string | null;
}) {
  const open = !joined && (phase === "upcoming" || phase === "ongoing");
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className={cn(
          "flex min-h-32 flex-col justify-center gap-2 p-5",
          COVER_CLASS[coverToneFor(event.id)],
        )}
      >
        <p className="truncate text-overline uppercase">
          {event.field?.name ?? "Umum"}
        </p>
        <h2 className="line-clamp-2 text-h2">{event.title}</h2>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex min-w-0 items-center gap-2">
          <OrgLogo name={event.organization.name} src={logoUrl} size="sm" />
          <p className="min-w-0 truncate text-small-strong text-foreground">
            {event.organization.name}
            <span className="font-normal text-muted-foreground">
              {" "}
              · {orgTypeLabel(event.organization.type)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PhaseBadge phase={phase} />
          {joined ? (
            <span className="ml-auto flex items-center gap-1 text-caption-strong text-success-600">
              <CircleCheckIcon aria-hidden="true" className="size-3.5" />
              Sudah diikuti
            </span>
          ) : (
            <span className="ml-auto text-caption text-subtle">
              {event.participantType === "TEAM"
                ? `Acara tim · maks ${event.maxTeamMembers ?? 1}`
                : "Pendaftaran mandiri"}
            </span>
          )}
        </div>
        {event.description && (
          <p className="line-clamp-2 text-small text-label">
            {event.description}
          </p>
        )}
        <div className="mt-auto flex flex-col gap-1.5 text-caption text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
            />
            <span className="truncate">
              {event.startsAt ? formatDate(event.startsAt) : "-"} –{" "}
              {event.endsAt ? formatDate(event.endsAt) : "-"}
            </span>
            <span className="ml-auto shrink-0">
              {event._count.milestones} milestone
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>
              {event.certificateEnabled ? "Sertifikat" : "Tanpa sertifikat"}
            </span>
            <span className="truncate">Guru: {event.creator.name}</span>
          </div>
        </div>
        <Link
          href={`/jelajah/${event.id}`}
          className={cn(
            buttonVariants({ variant: open ? "primary" : "secondary" }),
            "w-full",
          )}
        >
          {open ? "Lihat detail & ikuti" : "Lihat detail acara"}
          <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export { ExploreCard };
