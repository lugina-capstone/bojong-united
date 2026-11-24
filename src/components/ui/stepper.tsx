import { cn } from "@/lib/utils";
import { CheckIcon, ChevronRightIcon } from "lucide-react";

const EVENT_STEPS = [
  "Informasi acara",
  "Milestone",
  "Rubrik",
  "Peserta",
  "Tinjau & terbitkan",
];
const MATERIAL_STEPS = ["Informasi materi", "Konten", "Tinjau & terbitkan"];

/** Stepper wizard (Acara 5 langkah, Materi 3 langkah). `current` dimulai dari 1. */
function Stepper({
  steps,
  current,
  className,
}: {
  steps: readonly string[];
  current: number;
  className?: string;
}) {
  return (
    <nav
      aria-label="Langkah"
      className={cn("rounded-xl border border-border bg-card p-3.5", className)}
    >
      <ol className="flex items-center gap-2">
        {steps.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-2.5",
                active ? "flex-1" : "sm:flex-1",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg text-small-strong",
                  done && "bg-success-50 text-success-600",
                  active && "bg-primary-500 text-inverse",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? (
                  <CheckIcon aria-hidden="true" className="size-4" />
                ) : (
                  number
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-caption-strong",
                  active
                    ? "text-primary-500"
                    : done
                      ? "text-tone-slate-fg"
                      : "text-subtle",
                  !active && "hidden sm:block",
                )}
              >
                {label}
              </span>
              {number < steps.length && (
                <ChevronRightIcon
                  aria-hidden="true"
                  className="hidden size-3.5 shrink-0 text-subtle sm:block"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Stepper, EVENT_STEPS, MATERIAL_STEPS };
