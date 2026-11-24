"use client";

import { CheckIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  emptyRubric,
  RubricForm,
  type RubricFormValue,
} from "@/app/(app)/ruang-kerja/rubrik/_components/rubric-form";
import {
  createRubricAction,
  updateRubricAction,
} from "@/app/(app)/ruang-kerja/rubrik/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { milestoneScore } from "@/lib/event-rules";
import { cn } from "@/lib/utils";

/** Halaman Buat/Edit rubrik dengan pratinjau lembar penilaian dan simulasi nilai. */
function RubricEditor({
  rubricId,
  initial,
  fields,
  locked = false,
  cancelHref,
}: {
  rubricId?: string;
  initial?: RubricFormValue;
  fields: { id: string; name: string }[];
  locked?: boolean;
  cancelHref: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(() => initial ?? emptyRubric());
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [scores, setScores] = React.useState<number[]>(() =>
    (initial?.criteria ?? [null]).map(() => 5),
  );
  const [pending, startTransition] = React.useTransition();
  const simulated = value.criteria.map((_, i) => scores[i] ?? 5);
  const result = milestoneScore(simulated);

  function change(next: RubricFormValue) {
    setValue(next);
    setErrors({});
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const saved = rubricId
        ? await updateRubricAction(rubricId, value)
        : await createRubricAction(value);
      setErrors(saved.fieldErrors ?? {});
      if (!saved.ok || !saved.rubricId)
        return void toast.error(saved.error ?? "Rubrik gagal disimpan.");
      toast.success(
        rubricId && saved.rubricId !== rubricId
          ? "Disimpan sebagai versi baru. Nilai lama tetap memakai versi sebelumnya."
          : "Rubrik disimpan.",
      );
      router.push(`/ruang-kerja/rubrik/${saved.rubricId}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="flex min-w-0 flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
        {locked && (
          <Alert tone="warning" title="Rubrik sudah dipakai menilai">
            Perubahan akan disimpan sebagai versi baru agar nilai yang sudah ada
            tetap konsisten.
          </Alert>
        )}
        <RubricForm
          value={value}
          onChange={change}
          fields={fields}
          errors={errors}
        />
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: "secondary" })}
          >
            Batal
          </Link>
          <Button type="submit" disabled={pending}>
            {locked ? (
              <LockIcon aria-hidden="true" />
            ) : (
              <CheckIcon aria-hidden="true" />
            )}
            {locked
              ? "Simpan sebagai versi baru"
              : rubricId
                ? "Simpan perubahan"
                : "Simpan rubrik"}
          </Button>
        </div>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="text-overline text-primary-500">
              Pratinjau lembar penilaian
            </p>
            <h2 className="text-h3 text-foreground">Tampilan saat menilai</h2>
          </div>
          <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-center">
            {[
              ["Kriteria", value.criteria.length],
              ["Skala skor", "1–5"],
              ["Skor maks.", value.criteria.length * 5],
            ].map(([label, stat]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dd className="text-h3 text-foreground">{stat}</dd>
                <dt className="text-caption text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
          <ol className="flex flex-col gap-4">
            {value.criteria.map((criterion, index) => (
              <li key={index} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-small-strong text-foreground">
                    {index + 1}. {criterion.name || "Kriteria tanpa nama"}
                  </span>
                  <span className="shrink-0 text-caption-strong text-primary-500">
                    Dipilih: {simulated[index]}/5
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label={`Simulasi skor ${criterion.name || index + 1}`}
                  className="grid grid-cols-5 gap-1.5"
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      role="radio"
                      aria-checked={simulated[index] === score}
                      title={
                        criterion[`level${score}` as "level1"] || undefined
                      }
                      onClick={() =>
                        setScores((current) => {
                          const next = value.criteria.map(
                            (_, i) => current[i] ?? 5,
                          );
                          next[index] = score;
                          return next;
                        })
                      }
                      className={cn(
                        "h-8 rounded-md border border-border text-small-medium text-label transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring",
                        simulated[index] === score &&
                          "border-primary-500 bg-primary-500 text-inverse hover:bg-primary-500",
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <p className="text-caption text-muted-foreground">
                  {criterion[`level${simulated[index]}` as "level1"]}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <h2 className="text-body-strong text-foreground">
            Simulasi konversi nilai
          </h2>
          <p className="text-small-strong text-primary-600">
            Nilai = (total skor ÷ {result.max}) × 100
          </p>
          <div className="flex items-end justify-between gap-3 rounded-lg bg-card p-4">
            <div className="flex flex-col">
              <span className="text-small-strong text-foreground">
                Total skor {result.total} / {result.max}
              </span>
              <span className="text-caption text-muted-foreground">
                Tanpa bobot, semua kriteria setara
              </span>
            </div>
            <span className="text-display text-primary-600">
              {result.score.toLocaleString("id-ID")}
            </span>
          </div>
        </section>
      </aside>
    </form>
  );
}

export { RubricEditor };
