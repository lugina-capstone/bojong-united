import { cn } from "cn";
import { ClockIcon, LayersIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { OrgLogo } from "@/components/ui/org-logo";
import { Progress } from "@/components/ui/progress";

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
  sections,
  duration,
  learners,
  status,
  progress = 0,
  className,
}: {
  title: string;
  category: string;
  description: string;
  organization: string;
  organizationLogo?: string | null;
  sections: number;
  duration: string;
  learners: number;
  status: MaterialStatus;
  progress?: number;
  className?: string;
}) {
  return (
    <article
      data-slot="material-card"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:w-88",
        className,
      )}
    >
      <div className={cn("flex h-32 flex-col gap-2.5 p-4.5", COVER[status])}>
        <p className="text-overline">{category}</p>
        <h3 className="line-clamp-2 text-h2">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4.5">
        <div className="flex min-w-0 items-center gap-2">
          <OrgLogo name={organization} src={organizationLogo} size="sm" />
          <p className="truncate text-small-strong text-foreground">
            {organization}
          </p>
        </div>
        <div className="flex gap-1.5">
          {status === "completed" ? (
            <Badge tone="success">Selesai</Badge>
          ) : status === "in-progress" ? (
            <Badge>Sedang dipelajari</Badge>
          ) : (
            <Badge tone="neutral">Belum diikuti</Badge>
          )}
          <Badge tone="neutral">Tanpa tugas</Badge>
        </div>
        <p className="line-clamp-2 text-small text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-wrap gap-3.5 text-small text-label">
          <span className="flex items-center gap-1.5">
            <LayersIcon aria-hidden="true" className="size-3.5" />
            {sections} bagian
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon aria-hidden="true" className="size-3.5" />
            {duration}
          </span>
          <span className="flex items-center gap-1.5">
            <UsersIcon aria-hidden="true" className="size-3.5" />
            {learners}
            <span className="sr-only">peserta</span>
          </span>
        </div>
        {status === "in-progress" && (
          <div className="mt-auto flex items-center gap-2">
            <Progress value={progress} label={`Progres ${title}`} />
            <span className="text-caption-strong text-label">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export { MaterialCard, type MaterialStatus };
