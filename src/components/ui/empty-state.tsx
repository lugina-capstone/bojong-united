import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

import { IconBox } from "@/components/ui/icon-box";

/** Keadaan kosong: ikon, judul, keterangan, dan aksi opsional. */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-input bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <IconBox icon={icon} tone="muted" size="lg" />
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-h3 text-foreground">{title}</p>
        {description && (
          <p className="text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export { EmptyState };
