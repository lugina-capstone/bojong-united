import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GradePanel } from "@/app/(app)/ruang-kerja/acara/[id]/nilai/[submissionId]/_components/grade-panel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { FileItem } from "@/components/ui/file-item";
import { requireAssessableEvent } from "@/lib/assessment";
import { eventPhase } from "@/lib/event-rules";
import { db } from "@/lib/db";
import { formatDateTime, formatFileSize, formatScore } from "@/lib/format";

export const metadata: Metadata = { title: "Penilaian peserta" };

export default async function GradePage({
  params,
}: PageProps<"/ruang-kerja/acara/[id]/nilai/[submissionId]">) {
  const { id, submissionId } = await params;
  const { event } = await requireAssessableEvent(id);
  const submission = await db.submission.findFirst({
    where: { id: submissionId, milestone: { eventId: id } },
    include: {
      user: { select: { name: true, email: true } },
      milestone: {
        include: {
          rubric: {
            include: { criteria: { orderBy: { order: "asc" } } },
          },
          survey: {
            include: {
              questions: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!submission) notFound();
  const { milestone } = submission;
  const versions = await db.submission.findMany({
    where: { milestoneId: milestone.id, userId: submission.userId },
    orderBy: { version: "desc" },
    include: {
      file: { select: { id: true, name: true, size: true, contentType: true } },
      revisionRequest: { include: { requestedBy: { select: { name: true } } } },
      grade: {
        include: {
          grader: { select: { name: true } },
          scores: { include: { criterion: true } },
        },
      },
    },
  });
  const latest = versions[0]!;
  const survey = milestone.survey
    ? await db.surveyResponse.findUnique({
        where: {
          surveyId_userId: {
            surveyId: milestone.survey.id,
            userId: submission.userId,
          },
        },
        include: { answers: true },
      })
    : null;
  const enrollment = await db.enrollment.findUnique({
    where: { eventId_userId: { eventId: id, userId: submission.userId } },
    select: { team: { select: { name: true } } },
  });
  const canGrade = latest.status === "SUBMITTED" && Boolean(milestone.rubric);

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/acara" className="hover:text-foreground">
          Acara Saya
        </Link>{" "}
        /{" "}
        <Link
          href={`/ruang-kerja/acara/${id}`}
          className="hover:text-foreground"
        >
          {event.title}
        </Link>{" "}
        / Penilaian
      </nav>
      <div className="flex flex-col gap-1">
        <h1 className="text-display text-foreground">
          {latest.status === "REVISION_REQUESTED"
            ? "Permintaan revisi terkirim"
            : "Penilaian peserta"}
        </h1>
        <p className="text-small text-muted-foreground">
          Tinjau hasil pekerjaan, pilih skor rubrik, lalu kirimkan nilai atau
          revisi.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-foreground">{submission.user.name}</h2>
          <p className="text-small text-label">
            {enrollment?.team ? `${enrollment.team.name} · ` : "Peserta · "}
            Milestone {milestone.order} · {milestone.title}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-small text-label">
          <CheckCircle2Icon
            aria-hidden="true"
            className="size-4 text-success-500"
          />
          Versi {latest.version} dikumpulkan{" "}
          {formatDateTime(latest.submittedAt)}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {latest.status === "REVISION_REQUESTED" && (
            <section className="flex flex-col gap-2 rounded-2xl border border-warning-200 bg-warning-50 p-5 sm:p-6">
              <Badge tone="warning" className="w-fit">
                Revisi
              </Badge>
              <h2 className="text-h2 text-foreground">
                Menunggu unggah ulang peserta
              </h2>
              <p className="text-small text-label">
                {latest.revisionRequest?.note}
              </p>
            </section>
          )}
          {versions.map((v) => (
            <section
              key={v.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-h3 text-foreground">Bukti pekerjaan</h2>
                <span className="text-caption text-muted-foreground">
                  Versi {v.version} · {formatDateTime(v.submittedAt)}
                </span>
              </div>
              {v.file && (
                <FileItem
                  name={v.file.name}
                  meta={formatFileSize(v.file.size)}
                  kind={
                    v.file.contentType.startsWith("image/") ? "image" : "file"
                  }
                  action={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Buka ${v.file.name}`}
                      nativeButton={false}
                      render={
                        <a
                          href={`/api/files/${v.file.id}`}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <ExternalLinkIcon aria-hidden="true" />
                    </Button>
                  }
                />
              )}
              {v.link && (
                <a
                  href={v.link}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-small text-primary-600 underline"
                >
                  {v.link}
                </a>
              )}
              {v.text && (
                <p className="text-small whitespace-pre-line text-label">
                  {v.text}
                </p>
              )}
              {v.revisionRequest && (
                <p className="rounded-lg bg-warning-50 p-3 text-caption text-warning-700">
                  Revisi diminta oleh {v.revisionRequest.requestedBy.name}:{" "}
                  {v.revisionRequest.note}
                </p>
              )}
              {v.grade && (
                <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-small">
                  <p className="text-small-strong text-foreground">
                    Nilai {formatScore(v.grade.score)} · dinilai{" "}
                    {v.grade.grader.name}
                  </p>
                  <ul className="flex flex-col gap-1 text-label">
                    {[...v.grade.scores]
                      .sort((a, b) => a.criterion.order - b.criterion.order)
                      .map((s) => (
                        <li
                          key={s.criterionId}
                          className="flex justify-between"
                        >
                          <span>{s.criterion.name}</span>
                          <span>{s.score} / 5</span>
                        </li>
                      ))}
                  </ul>
                  {v.grade.feedback && (
                    <p className="whitespace-pre-line text-label">
                      {v.grade.feedback}
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
        <aside className="flex flex-col gap-4">
          {canGrade ? (
            <GradePanel
              submissionId={latest.id}
              participantName={submission.user.name}
              kkm={event.kkm}
              canRequestRevision={eventPhase(event) === "ongoing"}
              criteria={milestone.rubric!.criteria.map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                levels: [c.level1, c.level2, c.level3, c.level4, c.level5],
              }))}
            />
          ) : (
            <section className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-h3 text-foreground">Nilai terbaru</h2>
              <p className="text-small text-muted-foreground">
                {latest.grade
                  ? `Versi ${latest.version} sudah dinilai: ${formatScore(latest.grade.score)}.`
                  : "Nilai ditetapkan setelah peserta mengirim revisi dan diperiksa ulang."}
              </p>
            </section>
          )}
          {milestone.survey && (
            <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-h3 text-foreground">
                Survei milestone {milestone.order}
              </h2>
              {survey ? (
                <dl className="flex flex-col gap-2 text-small">
                  {milestone.survey.questions.map((q) => (
                    <div key={q.id} className="flex flex-col">
                      <dt className="text-muted-foreground">{q.text}</dt>
                      <dd className="text-foreground">
                        {survey.answers.find((a) => a.questionId === q.id)
                          ?.value ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-small text-muted-foreground">
                  Peserta belum mengisi survei.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
      <Link
        href={`/ruang-kerja/acara/${id}`}
        className={buttonVariants({ variant: "secondary", className: "w-fit" })}
      >
        <ArrowLeftIcon aria-hidden="true" />
        Kembali ke Pantau Progres
      </Link>
    </div>
  );
}
