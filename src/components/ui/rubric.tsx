"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "cn";

const SCORES = [1, 2, 3, 4, 5] as const;

/** Baris kriteria rubrik bernomor (tabel penilaian Guru). */
function RubricCriterion({
  order,
  name,
  range = "Skor 1–5",
  className,
}: {
  order: number;
  name: string;
  range?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-6.5 shrink-0 items-center justify-center rounded-md bg-primary-50 text-caption-strong text-primary-500">
        {order}
      </span>
      <p className="min-w-0 flex-1 text-h3 text-label">{name}</p>
      <p className="shrink-0 text-right text-caption text-muted-foreground">
        {range}
      </p>
    </div>
  );
}

/** Pemilih skor 1–5 untuk satu kriteria. Tanpa `onValueChange` tampil sebagai ringkasan. */
function RubricScoreRow({
  name,
  value,
  onValueChange,
  disabled,
  className,
}: {
  name: string;
  value?: number | null;
  onValueChange?: (score: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  if (!onValueChange) {
    return (
      <div className={cn("flex items-center gap-2.5 text-small", className)}>
        <p className="min-w-0 flex-1 text-label">{name}</p>
        <p className="text-small-strong text-foreground">{value ?? "–"}</p>
        <p className="w-9 text-right text-caption text-subtle">1–5</p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 border-b border-border pb-3.5",
        className,
      )}
    >
      <p className="text-h3 text-label">{name}</p>
      <RadioGroup
        aria-label={`Skor ${name}`}
        value={value ?? null}
        onValueChange={(score) => onValueChange(score as number)}
        disabled={disabled}
        className="flex gap-2"
      >
        {SCORES.map((score) => (
          <Radio.Root
            key={score}
            value={score}
            className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-md border border-input bg-card text-body-strong text-text-secondary transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring disabled:opacity-45 data-checked:border-primary-500 data-checked:bg-primary-500 data-checked:text-inverse"
          >
            {score}
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  );
}

export { RubricCriterion, RubricScoreRow };
