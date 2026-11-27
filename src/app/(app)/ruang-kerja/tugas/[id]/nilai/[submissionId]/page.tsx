import { WebLink } from "@/components/ui/web-link";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GradePanel } from "@/app/(app)/ruang-kerja/tugas/[id]/nilai/[submissionId]/_components/grade-panel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { FileItem } from "@/components/ui/file-item";
import { requireAssessableEvent } from "@/lib/assessment";
import { eventPhase } from "@/lib/event-rules";
import { db } from "@/lib/db";
import { formatDateTime, formatFileSize, formatScore } from "@/lib/format";
import {
  filesOfSubmission,
  isRevisionOverdue,
  parseRevisionFocusPoints,
} from "@/lib/submission-helpers";

export const metadata: Metadata = { title: "Penilaian peserta" };

export default async function GradePage({
  params,
}: PageProps<"/ruang-kerja/tugas/[id]/nilai/[submissionId]">) {
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
      files: {
        orderBy: { position: "asc" },
        include: {
          file: {
            select: { id: true, name: true, size: true, contentType: true },
          },
        },
      },
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
  const revisionOverdue =
    latest.status === "REVISION_REQUESTED" &&
    isRevisionOverdue(latest.revisionRequest?.dueAt);
  const latestRevisionFocuses = latest.revisionRequest
    ? parseRevisionFocusPoints(latest.revisionRequest.focusPoints)
    : [];
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
  const canGrade =
    (latest.status === "SUBMITTED" || revisionOverdue) &&
    Boolean(milestone.rubric);

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/tugas" className="hover:text-foreground">
          Tugas &amp; Penilaian
        </Link>{" "}
        /{" "}
        <Link
          href={`/ruang-kerja/tugas/${id}`}
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
            <section className="flex flex-col gap-3 rounded-2xl border border-warning-200 bg-warning-50 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={revisionOverdue ? "danger" : "warning"}
                  className="w-fit"
                >
                  {revisionOverdue ? "Batas revisi terlewat" : "Revisi"}
                </Badge>
                {latest.revisionRequest?.dueAt && (
                  <span className="text-caption text-muted-foreground">
                    Batas revisi: {formatDateTime(latest.revisionRequest.dueAt)}{" "}
                    WIB
                  </span>
                )}
              </div>
              <h2 className="text-h2 text-foreground">
                {revisionOverdue
                  ? "Peserta tidak mengirim revisi tepat waktu"
                  : "Menunggu unggah ulang peserta"}
              </h2>
              <p className="text-small whitespace-pre-line text-label">
                {latest.revisionRequest?.note}
              </p>
              {latestRevisionFocuses.length > 0 && (
                <ol className="flex flex-col gap-1.5 text-small text-label">
                  {latestRevisionFocuses.map((fp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-semibold text-primary-600">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <span>
                        <span className="font-semibold">{fp.title}</span>
                        {fp.detail ? ` — ${fp.detail}` : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {revisionOverdue && (
                <p className="text-caption text-muted-foreground">
                  Anda dapat langsung memberi nilai pada versi ini melalui
                  lembar penilaian di samping.
                </p>
              )}
            </section>
          )}
          {versions.map((v) => {
            const subFiles = filesOfSubmission(v);
            const revFocuses = v.revisionRequest
              ? parseRevisionFocusPoints(v.revisionRequest.focusPoints)
              : [];
            return (
              <section
                key={v.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-h3 text-foreground">Bukti pekerjaan</h2>
                  <span className="text-caption text-muted-foreground">
                    Versi {v.version} · {formatDateTime(v.submittedAt)} WIB
                  </span>
                </div>
                {subFiles.map((file) => (
                  <div key={file.id} className="flex flex-col gap-2">
                    <FileItem
                      name={file.name}
                      meta={formatFileSize(file.size)}
                      kind={
                        file.contentType.startsWith("image/") ? "image" : "file"
                      }
                      action={
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Buka ${file.name}`}
                          nativeButton={false}
                          render={
                            <a
                              href={`/api/files/${file.id}`}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <ExternalLinkIcon aria-hidden="true" />
                        </Button>
                      }
                    />
                    {file.contentType.startsWith("image/") && (
                      <figure className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-3">
                        <figcaption className="text-caption text-muted-foreground">
                          Pratinjau {file.name}
                        </figcaption>
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL sementara dari storage privat */}
                        <img
                          src={`/api/files/${file.id}`}
                          alt={`Pratinjau ${file.name}`}
                          loading="lazy"
                          className="max-h-128 w-full rounded-md object-contain"
                        />
                      </figure>
                    )}
                  </div>
                ))}
                {v.link && (
                  <WebLink
                    href={v.link}
                    className="truncate text-small text-primary-600 underline"
                  />
                )}
                {v.text && (
                  <p className="text-small whitespace-pre-line text-label">
                    {v.text}
                  </p>
                )}
                {v.revisionNote && (
                  <div className="flex flex-col gap-1 rounded-lg border border-primary-100 bg-primary-50/70 p-3 text-small">
                    <span className="text-caption-strong text-primary-700">
                      Catatan revisi peserta
                    </span>
                    <p className="whitespace-pre-line text-label">
                      {v.revisionNote}
                    </p>
                  </div>
                )}
                {v.revisionRequest && (
                  <div className="flex flex-col gap-1.5 rounded-lg bg-warning-50 p-3 text-caption text-warning-700">
                    <p>
                      Revisi diminta oleh {v.revisionRequest.requestedBy.name}:{" "}
                      {v.revisionRequest.note}
                    </p>
                    {v.revisionRequest.dueAt && (
                      <p>
                        Batas revisi: {formatDateTime(v.revisionRequest.dueAt)}{" "}
                        WIB
                      </p>
                    )}
                    {revFocuses.length > 0 && (
                      <ol className="flex flex-col gap-0.5 pl-4">
                        {revFocuses.map((fp, idx) => (
                          <li key={idx} className="list-decimal">
                            {fp.title}
                            {fp.detail ? ` — ${fp.detail}` : ""}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
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
            );
          })}
        </div>
        <aside className="flex flex-col gap-4">
          {canGrade ? (
            <GradePanel
              submissionId={latest.id}
              participantName={submission.user.name}
              kkm={event.kkm}
              canRequestRevision={
                latest.status === "SUBMITTED" && eventPhase(event) === "ongoing"
              }
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
        href={`/ruang-kerja/tugas/${id}`}
        className={buttonVariants({ variant: "secondary", className: "w-fit" })}
      >
        <ArrowLeftIcon aria-hidden="true" />
        Kembali ke Pantau Progres
      </Link>
    </div>
  );
}
