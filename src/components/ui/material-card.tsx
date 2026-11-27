import { cn } from "@/lib/utils";
import {
  BookOpenIcon,
  CircleCheckIcon,
  ClockIcon,
  LayersIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { OrgLogo } from "@/components/ui/org-logo";
import { Progress } from "@/components/ui/progress";
import type { CoverTone } from "@/components/ui/event-card";
import { COVER_CLASS } from "@/lib/event-cover";

type MaterialStatus = "not-started" | "in-progress" | "completed";

const COVER: Record<MaterialStatus, string> = {
  "not-started": "bg-primary-50 text-primary-600",
  "in-progress": "bg-tone-blue-bg text-tone-blue-fg",
  completed: "bg-tone-peach-bg text-tone-peach-fg",
};

/** Kartu materi; di grid lebarnya tetap 352 px (README §5.4). */
function MaterialCard({
  title,
  category,
  description,
  organization,
  organizationLogo,
  trainer,
  levelLabel,
  sections,
  duration,
  learners,
  status,
  progress = 0,
  cover,
  action,
  className,
}: {
  title: string;
  category: string;
  description: string;
  organization: string;
  organizationLogo?: string | null;
  /** Nama trainer di samping organisasi (tampil redup). */
  trainer?: string;
  /** Label tingkat materi (Pemula/Menengah/Mahir) sesuai Figma; tanpa ini menampilkan badge status. */
  levelLabel?: string;
  sections: number;
  duration: string;
  learners: number;
  status: MaterialStatus;
  progress?: number;
  /** Warna sampul materi; tanpa ini warna mengikuti status. */
  cover?: CoverTone;
  /** Tombol aksi di bagian bawah di dalam kartu. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      data-slot="material-card"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:max-w-88",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-32 flex-col justify-center gap-2 p-4.5",
          cover ? COVER_CLASS[cover] : COVER[status],
        )}
      >
        <p className="text-overline uppercase">{category}</p>
        <h3 className="line-clamp-2 text-h2">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4.5">
        <div className="flex min-w-0 items-center gap-2">
          <OrgLogo name={organization} src={organizationLogo} size="sm" />
          <p className="min-w-0 truncate text-small-strong text-foreground">
            {organization}
            {trainer && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {trainer}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {levelLabel ? (
            <Badge tone="primary">{levelLabel}</Badge>
          ) : status === "completed" ? (
            <Badge tone="success">Selesai</Badge>
          ) : status === "in-progress" ? (
            <Badge>Sedang dipelajari</Badge>
          ) : (
            <Badge tone="neutral">Belum diikuti</Badge>
          )}
          <Badge tone="neutral">
            <BookOpenIcon aria-hidden="true" />
            Tanpa tugas
          </Badge>
        </div>
        <p className="line-clamp-2 text-small text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-wrap gap-3.5 text-small text-label">
          <span className="flex items-center gap-1.5">
            <LayersIcon aria-hidden="true" className="size-3.5" />
            {sections} bagian
          </span>
          {duration && duration !== "–" && duration !== "-" && (
            <span className="flex items-center gap-1.5">
              <ClockIcon aria-hidden="true" className="size-3.5" />
              {duration}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <UsersIcon aria-hidden="true" className="size-3.5" />
            {learners}
            <span className="sr-only">peserta</span>
          </span>
        </div>
        {(status === "in-progress" || status === "completed" || action) && (
          <div className="mt-auto flex flex-col gap-2.5 pt-1">
            {status === "in-progress" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-small-strong text-primary-500">
                  <span>Sedang dipelajari</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} label={`Progres ${title}`} />
              </div>
            )}
            {status === "completed" && action && (
              <p className="flex items-center gap-1.5 text-small-strong text-success-500">
                <CircleCheckIcon
                  aria-hidden="true"
                  className="size-4 shrink-0"
                />
                Selesai · tersimpan di Riwayat belajar
              </p>
            )}
            {action}
          </div>
        )}
      </div>
    </article>
  );
}

export { MaterialCard, type MaterialStatus };
