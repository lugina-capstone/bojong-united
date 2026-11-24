import { cn } from "@/lib/utils";

/** Bilah progres: ≥ 50% hijau (success/500), < 50% biru (primary/500). Lebar isi = persentase asli. */
function Progress({
  value,
  className,
  label = "Progres",
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      data-slot="progress"
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          percent >= 50 ? "bg-success-500" : "bg-primary-500",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Wajib tampil di dekat tabel/kartu yang memakai Progress. */
function ProgressLegend({ className }: { className?: string }) {
  return (
    <div
      data-slot="progress-legend"
      className={cn(
        "flex flex-wrap items-center gap-4 text-small text-muted-foreground",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-success-500"
        />
        ≥ 50% selesai
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-primary-500"
        />
        &lt; 50% selesai
      </span>
    </div>
  );
}

export { Progress, ProgressLegend };
