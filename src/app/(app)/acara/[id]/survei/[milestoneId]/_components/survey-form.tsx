"use client";

import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  LockKeyholeIcon,
  SendIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { submitSurveyAction } from "@/app/(app)/acara/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  order: number;
  text: string;
  type: "RATING" | "SINGLE_CHOICE" | "TEXT";
  options: string[];
  required: boolean;
};

const RATING_LABELS = [
  "Sangat tidak setuju",
  "Tidak setuju",
  "Netral",
  "Setuju",
  "Sangat setuju",
];

export function SurveyForm({
  milestoneId,
  milestoneOrder,
  eventId,
  questions,
  hasNext,
}: {
  milestoneId: string;
  milestoneOrder: number;
  eventId: string;
  questions: Question[];
  hasNext: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();
  const required = questions.filter((q) => q.required);
  const filled = required.filter((q) => answers[q.id]?.trim()).length;
  const set = (id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setErrors((e) => ({ ...e, [id]: "" }));
  };

  function submit() {
    const next: Record<string, string> = {};
    for (const q of required)
      if (!answers[q.id]?.trim()) next[q.id] = "Pertanyaan ini wajib diisi.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    startTransition(async () => {
      const result = await submitSurveyAction(milestoneId, answers);
      if (result.ok) {
        toast.success(
          hasNext
            ? `Survei terkirim. Milestone ${milestoneOrder + 1} terbuka.`
            : "Survei terkirim.",
        );
        router.push(
          `/acara/${eventId}${hasNext ? `?m=${milestoneOrder + 1}` : ""}`,
        );
        return;
      }
      setErrors(result.fieldErrors ?? {});
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-small">
        <CheckCircle2Icon
          aria-hidden="true"
          className="size-4 text-primary-500"
        />
        <span className="text-small-strong text-primary-600">
          {filled} dari {required.length} pertanyaan wajib terisi
        </span>
        <span className="ml-auto hidden text-caption text-muted-foreground sm:inline">
          Pertanyaan bertanda * wajib diisi
        </span>
      </div>

      {questions.map((q) => (
        <fieldset
          key={q.id}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <legend className="sr-only">{q.text}</legend>
          <p className="text-overline text-muted-foreground">
            {String(q.order).padStart(2, "0")}
          </p>
          <p className="text-h3 text-foreground">
            {q.text}
            {q.required && " *"}
          </p>
          {q.type === "RATING" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              {RATING_LABELS.map((label, i) => {
                const value = String(i + 1);
                const active = answers[q.id] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set(q.id, value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-caption transition-colors outline-none focus-visible:shadow-focus-ring sm:flex-col sm:py-4",
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-border text-label hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border text-caption-strong",
                        active
                          ? "border-primary-500 bg-primary-500 text-inverse"
                          : "border-border",
                      )}
                    >
                      {value}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          {q.type === "SINGLE_CHOICE" && (
            <div className="flex flex-wrap gap-2">
              {q.options.map((option) => {
                const active = answers[q.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set(q.id, option)}
                    className={cn(
                      "rounded-lg border px-4 py-2.5 text-small transition-colors outline-none focus-visible:shadow-focus-ring",
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-border text-label hover:bg-muted",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
          {q.type === "TEXT" && (
            <Textarea
              rows={4}
              maxLength={2000}
              aria-label={q.text}
              placeholder="Ceritakan pengalaman Anda dengan singkat dan jelas."
              value={answers[q.id] ?? ""}
              onChange={(e) => set(q.id, e.target.value)}
            />
          )}
          {errors[q.id] && (
            <p className="text-caption text-danger-600">{errors[q.id]}</p>
          )}
        </fieldset>
      ))}

      <p className="flex items-center gap-2 text-caption text-muted-foreground">
        <LockKeyholeIcon aria-hidden="true" className="size-3.5" />
        Setelah dikirim, jawaban tidak dapat diubah.
        {hasNext && ` Milestone ${milestoneOrder + 1} akan terbuka otomatis.`}
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="secondary"
          nativeButton={false}
          render={<Link href={`/acara/${eventId}?m=${milestoneOrder}`} />}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Kembali ke petunjuk
        </Button>
        <Button size="lg" disabled={pending} onClick={submit}>
          {pending ? "Mengirim..." : "Kirim jawaban survei"}
          <SendIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
