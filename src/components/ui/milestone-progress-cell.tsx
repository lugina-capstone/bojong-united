import { cn } from "@/lib/utils";
import { CircleCheckIcon, CircleDashedIcon, ClockIcon } from "lucide-react";

type CellStatus = "graded" | "submitted" | "revision" | "empty";

const STATUS = {
  graded: {
    icon: CircleCheckIcon,
    color: "text-success-500",
    label: "Sudah dinilai",
  },
  submitted: {
    icon: ClockIcon,
    color: "text-primary-500",
    label: "Menunggu dinilai",
  },
  revision: { icon: ClockIcon, color: "text-warning-500", label: "Revisi" },
  empty: {
    icon: CircleDashedIcon,
    color: "text-subtle",
    label: "Belum kumpul",
  },
} as const;

/** Sel progres per milestone di tabel Pantau Progres. */
function MilestoneProgressCell({
  status,
  value,
  date,
  className,
}: {
  status: CellStatus;
  /** Nilai atau keterangan utama, mis. "86" atau "Dikumpulkan". */
  value?: string;
  date?: string;
  className?: string;
}) {
  const { icon: Icon, color, label } = STATUS[status];
  return (
    <div className={cn("flex w-30 flex-col gap-1.25", className)}>
      <div className="flex items-center gap-1.75">
        <Icon aria-hidden="true" className={cn("size-4 shrink-0", color)} />
        <span className="text-body text-label">{value ?? label}</span>
      </div>
      {status === "revision" ? (
        <span className="w-fit rounded-sm bg-warning-100 px-1.75 py-0.75 text-caption-strong text-warning-700">
          Revisi
        </span>
      ) : (
        <span className="text-caption text-muted-foreground">
          {date ?? label}
        </span>
      )}
    </div>
  );
}

export { MilestoneProgressCell, type CellStatus };
