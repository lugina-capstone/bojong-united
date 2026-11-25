"use client";

import { RotateCcwIcon, SendIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  gradeSubmissionAction,
  requestRevisionAction,
} from "@/app/(app)/ruang-kerja/tugas/[id]/nilai/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { milestoneScore } from "@/lib/event-rules";
import { cn } from "@/lib/utils";

type Criterion = {
  id: string;
  name: string;
  description: string | null;
  levels: string[];
};

export function GradePanel({
  submissionId,
  participantName,
  criteria,
  kkm,
  canRequestRevision,
}: {
  canRequestRevision: boolean;
  submissionId: string;
  participantName: string;
  criteria: Criterion[];
  kkm: number;
}) {
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [feedback, setFeedback] = React.useState("");
  const [confirm, setConfirm] = React.useState(false);
  const [revisionOpen, setRevisionOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const filled = criteria.filter((c) => scores[c.id]).length;
  const result = milestoneScore(criteria.map((c) => scores[c.id] ?? 0));

  function sendGrade() {
    startTransition(async () => {
      const res = await gradeSubmissionAction(submissionId, {
        scores: criteria.map((c) => ({
          criterionId: c.id,
          score: scores[c.id],
        })),
        feedback: feedback.trim() || undefined,
      });
      setConfirm(false);
      if (res.ok) toast.success(`Nilai ${participantName} terkirim.`);
      else toast.error(res.error ?? "Nilai gagal dikirim.");
    });
  }

  function sendRevision() {
    if (note.trim().length < 10) {
      setError("Catatan revisi minimal 10 karakter.");
      return;
    }
    startTransition(async () => {
      const res = await requestRevisionAction(submissionId, { note });
      if (res.ok) {
        setRevisionOpen(false);
        toast.success("Permintaan revisi dikirim.");
      } else setError(res.error ?? "Permintaan revisi gagal dikirim.");
    });
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-foreground">Lembar penilaian</h2>
        <p className="text-small text-muted-foreground">
          Setiap kriteria dinilai 1–5. {filled} dari {criteria.length} kriteria
          terisi.
        </p>
      </div>
      {criteria.map((c, i) => (
        <fieldset key={c.id} className="flex flex-col gap-3">
          <legend className="text-body-strong text-foreground">
            {String(i + 1).padStart(2, "0")} · {c.name}
          </legend>
          {c.description && (
            <p className="text-small text-muted-foreground">{c.description}</p>
          )}
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={scores[c.id] === level}
                aria-label={`${c.name} skor ${level}`}
                onClick={() => setScores((s) => ({ ...s, [c.id]: level }))}
                className={cn(
                  "rounded-lg border py-2.5 text-small-strong transition-colors outline-none focus-visible:shadow-focus-ring",
                  scores[c.id] === level
                    ? "border-primary-500 bg-primary-500 text-inverse"
                    : "border-border text-label hover:bg-muted",
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <ol className="flex flex-col gap-1 text-caption text-muted-foreground">
            {c.levels.map((text, l) => (
              <li
                key={l}
                className={cn(
                  "rounded px-2 py-1",
                  scores[c.id] === l + 1 && "bg-primary-50 text-primary-700",
                )}
              >
                {l + 1} — {text}
              </li>
            ))}
          </ol>
        </fieldset>
      ))}

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-4">
        <div className="flex flex-col">
          <span className="text-caption text-label">Skor total</span>
          <span className="text-h2 text-foreground" data-testid="grade-total">
            {result.total} / {result.max}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-label">Nilai 0–100</span>
          <span
            data-testid="grade-score"
            className={cn(
              "text-h2",
              filled === criteria.length && result.score >= kkm
                ? "text-success-700"
                : "text-primary-600",
            )}
          >
            {result.score}
          </span>
        </div>
        <p className="col-span-2 text-caption text-muted-foreground">
          Nilai = total skor ÷ {result.max} × 100. KKM acara {kkm} dihitung dari
          rata-rata semua milestone.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="grade-feedback"
          className="text-small-strong text-foreground"
        >
          Umpan balik guru
        </label>
        <Textarea
          id="grade-feedback"
          rows={4}
          maxLength={2000}
          placeholder="Tulis umpan balik yang spesifik dan membangun…"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {canRequestRevision && (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setError("");
              setRevisionOpen(true);
            }}
          >
            <RotateCcwIcon aria-hidden="true" />
            Minta revisi
          </Button>
        )}
        <Button
          type="button"
          disabled={pending || filled < criteria.length}
          onClick={() => setConfirm(true)}
        >
          Kirim nilai &amp; umpan balik
          <SendIcon aria-hidden="true" />
        </Button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim nilai {result.score}?</AlertDialogTitle>
            <AlertDialogDescription>
              Nilai dan umpan balik langsung terlihat oleh {participantName} dan
              tidak dapat diubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Periksa lagi
            </AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={sendGrade}>
              {pending ? "Mengirim..." : "Ya, kirim nilai"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta revisi</DialogTitle>
            <DialogDescription>
              {participantName} akan menerima notifikasi dan mengirim versi
              berikutnya.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Catatan revisi"
            rows={5}
            maxLength={2000}
            placeholder="Jelaskan bagian yang perlu diperbaiki…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="text-caption text-danger-600">{error}</p>}
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setRevisionOpen(false)}
            >
              Batal
            </Button>
            <Button disabled={pending} onClick={sendRevision}>
              {pending ? "Mengirim..." : "Kirim permintaan revisi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
