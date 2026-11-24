import {
  CalendarDaysIcon,
  FileTextIcon,
  MessageSquareTextIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Kartu milestone di wizard acara dan detail acara. */
function MilestoneCard({
  order,
  title,
  description,
  deadline,
  formats,
  hasSurvey,
  status,
  actions,
  className,
}: {
  order: number;
  title: string;
  description?: string;
  deadline: string;
  /** Format pengumpulan, mis. ["PDF", "Tautan"]. */
  formats: string[];
  hasSurvey?: boolean;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      data-slot="milestone-card"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-small-strong text-primary-500">
          {order}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-body-strong text-foreground">{title}</h3>
          {description && (
            <p className="line-clamp-2 text-small text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {status}
        {actions}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-11 text-small text-label">
        <span className="flex items-center gap-1.5">
          <CalendarDaysIcon aria-hidden="true" className="size-3.5" />
          {deadline}
        </span>
        <span className="flex items-center gap-1.5">
          <FileTextIcon aria-hidden="true" className="size-3.5" />
          {formats.join(", ")}
        </span>
        {hasSurvey && (
          <Badge tone="neutral" size="sm">
            <MessageSquareTextIcon aria-hidden="true" />
            Survei
          </Badge>
        )}
      </div>
    </article>
  );
}

export { MilestoneCard };
