import { cn } from "cn";

const LEVELS = {
  1: { label: "Sangat kurang", tone: "bg-danger-100 text-danger-600" },
  2: { label: "Kurang", tone: "bg-warning-100 text-warning-700" },
  3: { label: "Cukup", tone: "bg-muted text-label" },
  4: { label: "Baik", tone: "bg-primary-100 text-primary-600" },
  5: { label: "Sangat baik", tone: "bg-success-100 text-success-600" },
} as const;

type ScoreValue = keyof typeof LEVELS;

/** Level skor rubrik 1–5 beserta labelnya. */
function ScoreLevel({
  score,
  label,
  className,
}: {
  score: ScoreValue;
  label?: string;
  className?: string;
}) {
  const level = LEVELS[score];
  return (
    <div
      data-slot="score-level"
      className={cn(
        "flex h-10 items-center gap-2 rounded-md border border-border bg-background px-2.5",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-sm text-caption-strong",
          level.tone,
        )}
      >
        {score}
      </span>
      <span className="min-w-0 flex-1 text-caption-strong text-text-secondary">
        {label ?? level.label}
      </span>
    </div>
  );
}

export { ScoreLevel, LEVELS as SCORE_LEVELS, type ScoreValue };
