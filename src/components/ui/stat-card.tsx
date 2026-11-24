import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const toneVariants = cva(
  "flex shrink-0 items-center justify-center rounded-lg",
  {
    variants: {
      tone: {
        primary: "bg-primary-50 text-primary-500",
        success: "bg-success-50 text-success-600",
        warning: "bg-warning-50 text-warning-700",
        neutral: "bg-muted text-label",
      },
    },
    defaultVariants: { tone: "primary" },
  },
);

const deltaTone = {
  primary: "bg-success-50 text-success-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  neutral: "bg-muted text-label",
} as const;

type StatCardProps = VariantProps<typeof toneVariants> & {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  /** Varian ringkas untuk baris statistik yang padat. */
  compact?: boolean;
  className?: string;
};

/** Kartu statistik; nada mengikuti ikon. */
function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
  compact,
  className,
}: StatCardProps) {
  const t = tone ?? "primary";
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4.5 shadow-sm",
        compact && "gap-2 rounded-xl p-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(toneVariants({ tone }), compact ? "size-8" : "size-9")}
        >
          <Icon
            aria-hidden="true"
            className={compact ? "size-4" : "size-4.5"}
          />
        </span>
        <p className="truncate text-small-medium text-muted-foreground">
          {label}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <p className={cn("text-foreground", compact ? "text-h2" : "text-stat")}>
          {value}
        </p>
        {delta && (
          <span
            className={cn(
              "rounded-full px-2.25 py-0.75 text-caption-strong",
              deltaTone[t],
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export { StatCard };
