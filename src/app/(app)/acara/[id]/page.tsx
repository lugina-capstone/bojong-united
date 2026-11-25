import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ExternalLinkIcon,
  LockKeyholeIcon,
  PauseCircleIcon,
  RotateCcwIcon,
  TimerOffIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SubmissionForm } from "@/app/(app)/acara/[id]/_components/submission-form";
import { EnrollButton } from "@/app/(app)/materi/_components/enroll-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { FileItem } from "@/components/ui/file-item";
import { InfoBox } from "@/components/ui/info-box";
import { Progress } from "@/components/ui/progress";
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatScore,
} from "@/lib/format";
import { db } from "@/lib/db";
import { requireParticipant } from "@/lib/participant-access";
import { loadWorkspace, type MilestoneView } from "@/lib/participant-workspace";
import { cn } from "@/lib/utils";
import { formatLabels, type submissionFormats } from "@/lib/validations/event";

export const metadata: Metadata = { title: "Ruang kerja acara" };

type Format = (typeof submissionFormats)[number];

function stepStatus(m: MilestoneView) {
  if (m.locked) return { label: "Terkunci", state: "locked" as const };
  if (m.latest?.status === "REVISION_REQUESTED")
    return { label: "Revisi", state: "revision" as const };
  if (m.latest?.status === "GRADED")
    return { label: "Dinilai", state: "done" as const };
  if (m.latest)
    return {
      label: m.survey && !m.surveyDone ? "Isi survei" : "Dikumpulkan",
      state: "done" as const,
    };
  if (m.overdue)
    return { label: "Tenggat terlewat", state: "overdue" as const };
  return { label: "Sedang dikerjakan", state: "active" as const };
}

export default async function WorkspacePage({
  params,
  searchParams,
}: PageProps<"/acara/[id]">) {
  const user = await requireParticipant();
  const { id } = await params;
  const sp = await searchParams;
  const ws = await loadWorkspace(id, user.id);
  const { event, milestones } = ws;
  const tab = sp.tab === "materi" ? "materi" : "milestone";
  const materialProgress = new Map(
    (tab === "materi"
      ? await db.materialEnrollment.findMany({
          where: {
            userId: user.id,
            materialId: { in: event.materials.map((m) => m.material.id) },
          },
          select: { materialId: true, progress: true, completedAt: true },
        })
      : []
    ).map((e) => [e.materialId, e]),
  );
  const requested = Number(sp.m);
  const fallback =
    milestones.find((m) => m.canSubmit) ??
    milestones[Math.min(Math.max(ws.unlocked, 0), milestones.length - 1)];
  const current =
    milestones.find((m) => m.order === requested && !m.locked) ?? fallback;
  const percent =
    milestones.length === 0
      ? 0
      : Math.round((ws.submittedCount / milestones.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/beranda"
        className="inline-flex w-fit items-center gap-1.5 text-small text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Beranda / Ruang kerja
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-overline text-primary-600">
            {event.field?.name ?? "Umum"} / Milestone berurutan
          </p>
          <h1 className="text-display text-foreground">{event.title}</h1>
          <p className="text-small text-muted-foreground">
            Guru: {event.creator.name}
            {event.startsAt && event.endsAt
              ? ` · ${formatDate(event.startsAt)} – ${formatDate(event.endsAt)}`
              : ""}
            {ws.enrollment.team ? ` · ${ws.enrollment.team.name}` : ""}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 lg:w-64">
          <div className="flex items-center justify-between">
            <span className="text-caption text-label">Tugas dikumpulkan</span>
            <span className="text-h3 text-primary-600">{percent}%</span>
          </div>
          <Progress value={percent} />
          <span className="text-caption text-muted-foreground">
            {ws.submittedCount} dari {milestones.length} tugas milestone
          </span>
        </div>
      </header>

      {ws.paused && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4 text-small text-warning-700"
        >
          <PauseCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          Acara dijeda karena organisasi penyelenggara dinonaktifkan. Karya dan
          nilai Anda tetap tersimpan, tetapi pengumpulan tidak dapat dilakukan
          untuk sementara.
        </div>
      )}
      {!ws.paused && ws.readOnly && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4 text-small text-label"
        >
          <LockKeyholeIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          Acara telah berakhir. Ruang kerja ini hanya dapat dilihat.
        </div>
      )}
      {!ws.started && !ws.readOnly && event.startsAt && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 text-small text-primary-700"
        >
          <CalendarClockIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          Acara dimulai {formatDateTime(event.startsAt)}. Milestone 1 terbuka
          otomatis saat acara dimulai.
        </div>
      )}

      <nav
        className="flex gap-1 border-b border-border"
        aria-label="Bagian ruang kerja"
      >
        {[
          { key: "milestone", label: "Milestone", href: `/acara/${id}` },
          {
            key: "materi",
            label: `Materi pendukung ${event.materials.length}`,
            href: `/acara/${id}?tab=materi`,
          },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-small-strong transition-colors",
              tab === t.key
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "materi" ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {event.materials.length === 0 ? (
            <p className="text-small text-muted-foreground">
              Guru belum menautkan materi pendukung.
            </p>
          ) : (
            event.materials.map(({ material }) => (
              <article
                key={material.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-4"
              >
                <BookOpenIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary-500"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <h2 className="text-body-strong text-foreground">
                    {material.title}
                  </h2>
                  {material.description && (
                    <p className="line-clamp-3 text-small text-muted-foreground">
                      {material.description}
                    </p>
                  )}
                  {(() => {
                    const e = materialProgress.get(material.id);
                    if (!e) {
                      return material.status === "PUBLISHED" && !ws.paused ? (
                        <EnrollButton
                          materialId={material.id}
                          size="sm"
                          className="mt-1 w-fit"
                        />
                      ) : null;
                    }
                    return (
                      <div className="mt-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={e.progress}
                            label={`Progres ${material.title}`}
                            className="flex-1"
                          />
                          <span className="text-caption-strong text-primary-600">
                            {e.progress}%
                          </span>
                        </div>
                        <Link
                          href={`/materi/${material.id}`}
                          className={buttonVariants({
                            size: "sm",
                            variant: e.completedAt ? "secondary" : "primary",
                            className: "w-fit",
                          })}
                        >
                          {e.completedAt ? "Buka lagi" : "Lanjutkan belajar"}
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              </article>
            ))
          )}
        </section>
      ) : current ? (
        <>
          <ol className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card p-2 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => {
              const s = stepStatus(m);
              const active = m.id === current.id;
              const body = (
                <>
                  <span
                    className={cn(
                      "flex size-6.5 shrink-0 items-center justify-center rounded-md text-caption-strong",
                      s.state === "locked" && "bg-muted text-subtle",
                      s.state === "done" && "bg-success-500 text-inverse",
                      s.state === "revision" && "bg-warning-500 text-inverse",
                      s.state === "overdue" && "bg-danger-500 text-inverse",
                      s.state === "active" && "bg-primary-500 text-inverse",
                    )}
                  >
                    {s.state === "locked" ? (
                      <LockKeyholeIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    ) : s.state === "done" ? (
                      <CheckCircle2Icon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    ) : (
                      m.order
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col text-caption">
                    <span
                      className={cn(
                        "truncate font-semibold",
                        s.state === "locked"
                          ? "text-subtle"
                          : "text-foreground",
                      )}
                    >
                      {m.title}
                    </span>
                    <span className="text-muted-foreground">
                      Milestone {m.order} · {s.label}
                    </span>
                  </span>
                </>
              );
              const cls = cn(
                "flex items-center gap-2 rounded-md border p-2.5",
                active
                  ? "border-primary-200 bg-primary-50"
                  : "border-transparent",
              );
              return (
                <li key={m.id}>
                  {m.locked ? (
                    <div
                      className={cn(cls, "cursor-not-allowed")}
                      aria-disabled="true"
                    >
                      {body}
                    </div>
                  ) : (
                    <Link
                      href={`/acara/${id}?m=${m.order}`}
                      aria-current={active ? "step" : undefined}
                      className={cn(cls, "hover:bg-muted")}
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <MilestoneDetail m={current} />
              <MilestoneState m={current} eventId={id} readOnly={ws.readOnly} />
              {current.canSubmit && (
                <SubmissionForm
                  key={`${current.id}-${current.latest?.version ?? 0}`}
                  milestoneId={current.id}
                  order={current.order}
                  formats={current.formats as string[]}
                  revision={current.latest?.status === "REVISION_REQUESTED"}
                />
              )}
              {current.submissions.length > 0 && <History m={current} />}
            </div>
            <aside className="flex flex-col gap-4">
              <section className="flex flex-col gap-1 rounded-xl bg-primary-50 p-5">
                <p className="text-small-strong text-label">
                  Tenggat milestone {current.order}
                </p>
                {current.dueAt ? (
                  <>
                    <p className="text-h2 text-foreground">
                      {formatDate(current.dueAt)}
                    </p>
                    <p className="text-small text-label">
                      {formatDateTime(current.dueAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-body text-label">Tanpa tenggat</p>
                )}
                <p className="pt-1 text-caption text-muted-foreground">
                  Format diterima:{" "}
                  {(current.formats as Format[])
                    .map((f) => formatLabels[f])
                    .join(", ")}
                </p>
              </section>
              {current.survey && (
                <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
                  <h2 className="text-body-strong text-foreground">
                    Langkah berikutnya: survei
                  </h2>
                  <Badge
                    tone={
                      current.surveyDone
                        ? "success"
                        : current.latest
                          ? "primary"
                          : "neutral"
                    }
                    className="w-fit"
                  >
                    {current.surveyDone
                      ? "Sudah terkirim"
                      : current.latest
                        ? "Tersedia"
                        : "Belum tersedia"}
                  </Badge>
                  <p className="text-small text-label">
                    Survei milestone {current.order} terbuka setelah tugas
                    dikumpulkan. Setelah survei dikirim, milestone berikutnya
                    terbuka otomatis.
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Anda tidak perlu menunggu penilaian guru untuk melanjutkan.
                  </p>
                </section>
              )}
              <InfoBox
                title="Cara membaca hasil penilaian"
                items={[
                  {
                    title: "Umpan balik",
                    description:
                      "Catatan dari guru. Anda tetap bisa melanjutkan ke milestone berikutnya.",
                  },
                  {
                    title: "Revisi diminta",
                    description:
                      "Perbaiki sesuai arahan guru dan kirim versi baru.",
                  },
                  {
                    title: "Nilai akhir & KKM",
                    description:
                      "Tampil setelah semua milestone dinilai. Sertifikat terbit jika nilai akhir memenuhi KKM.",
                  },
                ]}
              />
              {current.rubric && (
                <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
                  <h2 className="text-body-strong text-foreground">
                    {current.rubric.title}
                  </h2>
                  <p className="text-caption text-muted-foreground">
                    Setiap kriteria dinilai dengan skor 1–5.
                  </p>
                  <ul className="flex flex-col divide-y divide-border text-small">
                    {current.rubric.criteria.map((c) => (
                      <li
                        key={c.name}
                        className="flex justify-between gap-2 py-2"
                      >
                        <span className="text-label">{c.name}</span>
                        <span className="text-subtle">1–5</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-caption text-muted-foreground">
                    Nilai = (total skor ÷ {current.rubric.criteria.length * 5})
                    × 100
                  </p>
                </section>
              )}
              {ws.enrollment.certificate ? (
                <section className="flex flex-col gap-2 rounded-xl bg-success-50 p-5">
                  <h2 className="text-body-strong text-success-700">
                    Sertifikat tersedia
                  </h2>
                  <p className="text-small text-label">
                    Nilai akhir{" "}
                    {formatScore(ws.enrollment.certificate.finalScore)} memenuhi
                    KKM {event.kkm}.
                  </p>
                  <Link
                    href={`/sertifikat/${ws.enrollment.certificate.number}`}
                    className={buttonVariants({
                      size: "sm",
                      className: "w-fit",
                    })}
                  >
                    Lihat sertifikat
                  </Link>
                </section>
              ) : (
                event.certificateEnabled && (
                  <section className="flex flex-col gap-1 rounded-xl bg-muted p-5">
                    <h2 className="text-body-strong text-foreground">
                      Sertifikat otomatis
                    </h2>
                    <p className="text-small text-label">
                      Seluruh milestone selesai, seluruh nilai terbit, dan nilai
                      akhir minimal {event.kkm}. Tersimpan di portofolio Anda.
                    </p>
                  </section>
                )
              )}
            </aside>
          </div>
        </>
      ) : (
        <p className="text-small text-muted-foreground">
          Acara ini belum memiliki milestone.
        </p>
      )}
    </div>
  );
}

function MilestoneDetail({ m }: { m: MilestoneView }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-overline text-primary-600">
        Milestone {String(m.order).padStart(2, "0")}
      </p>
      <h2 className="text-display text-foreground">{m.title}</h2>
      {m.instructions && (
        <p className="text-body whitespace-pre-line text-label">
          {m.instructions}
        </p>
      )}
      {m.attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-small-strong text-foreground">
            Lampiran dari guru
          </h3>
          {m.attachments.map(({ file }) => (
            <FileItem
              key={file.id}
              name={file.name}
              meta={formatFileSize(file.size)}
              kind={file.contentType.startsWith("image/") ? "image" : "file"}
              action={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Unduh ${file.name}`}
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
          ))}
        </div>
      )}
    </section>
  );
}

function MilestoneState({
  m,
  eventId,
  readOnly,
}: {
  m: MilestoneView;
  eventId: string;
  readOnly: boolean;
}) {
  const latest = m.latest;
  if (latest?.status === "REVISION_REQUESTED" && latest.revisionRequest) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-warning-200 bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-h2 text-foreground">Revisi diminta</h2>
          <Badge tone="warning">
            <RotateCcwIcon aria-hidden="true" />
            Revisi
          </Badge>
        </div>
        <p className="text-small text-muted-foreground">
          {latest.revisionRequest.requestedBy.name} ·{" "}
          {formatDateTime(latest.revisionRequest.createdAt)}
        </p>
        <blockquote className="border-l-4 border-warning-500 bg-warning-50 p-4 text-small whitespace-pre-line text-label">
          {latest.revisionRequest.note}
        </blockquote>
      </section>
    );
  }
  if (latest?.status === "GRADED" && latest.grade) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-h2 text-foreground">
            Penilaian versi {latest.version}
          </h2>
          <span className="text-display text-primary-600">
            {formatScore(latest.grade.score)}
          </span>
        </div>
        <ul className="flex flex-col divide-y divide-border text-small">
          {[...latest.grade.scores]
            .sort((a, b) => a.criterion.order - b.criterion.order)
            .map((s) => (
              <li key={s.criterionId} className="flex justify-between py-2">
                <span className="text-label">{s.criterion.name}</span>
                <span className="text-foreground">{s.score} / 5</span>
              </li>
            ))}
        </ul>
        {latest.grade.feedback && (
          <div className="rounded-lg bg-muted p-4 text-small whitespace-pre-line text-label">
            {latest.grade.feedback}
          </div>
        )}
        {m.survey && !m.surveyDone && !readOnly && (
          <Button
            className="w-fit"
            nativeButton={false}
            render={<Link href={`/acara/${eventId}/survei/${m.id}`} />}
          >
            <ClipboardListIcon aria-hidden="true" />
            Isi survei milestone {m.order}
          </Button>
        )}
      </section>
    );
  }
  if (latest) {
    const needsSurvey = m.survey && !m.surveyDone;
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-success-200 bg-success-50 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-success-700">
          <CheckCircle2Icon aria-hidden="true" className="size-5" />
          <h2 className="text-h3">Tugas milestone {m.order} terkirim</h2>
        </div>
        <p className="text-small text-label">
          Menunggu hasil pemeriksaan guru · dikirim{" "}
          {formatDateTime(latest.submittedAt)}
        </p>
        {needsSurvey && !readOnly && (
          <Button
            className="w-fit"
            nativeButton={false}
            render={<Link href={`/acara/${eventId}/survei/${m.id}`} />}
          >
            <ClipboardListIcon aria-hidden="true" />
            Isi survei milestone {m.order}
          </Button>
        )}
      </section>
    );
  }
  if (m.overdue) {
    return (
      <section className="flex items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-5 text-danger-700 sm:p-6">
        <TimerOffIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">Tenggat terlewat</h2>
          <p className="text-small">
            Tenggat milestone ini sudah lewat, sehingga pengumpulan ditutup.
            Hubungi guru jika memerlukan perpanjangan.
          </p>
        </div>
      </section>
    );
  }
  return null;
}

function History({ m }: { m: MilestoneView }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-h2 text-foreground">Riwayat pengumpulan</h2>
      {m.submissions.map((s) => (
        <div key={s.id} className="flex flex-col gap-2 rounded-lg bg-muted p-3">
          <p className="text-caption-strong text-label">
            Versi {s.version} · {formatDateTime(s.submittedAt)} ·{" "}
            {s.status === "GRADED"
              ? "Dinilai"
              : s.status === "REVISION_REQUESTED"
                ? "Revisi diminta"
                : "Menunggu pemeriksaan"}
          </p>
          {s.file && (
            <FileItem
              name={s.file.name}
              meta={formatFileSize(s.file.size)}
              kind={s.file.contentType.startsWith("image/") ? "image" : "file"}
              action={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Buka ${s.file.name}`}
                  nativeButton={false}
                  render={
                    <a
                      href={`/api/files/${s.file.id}`}
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
          {s.link && (
            <a
              href={s.link}
              target="_blank"
              rel="noreferrer"
              className="truncate text-small text-primary-600 underline"
            >
              {s.link}
            </a>
          )}
          {s.text && (
            <p className="text-small whitespace-pre-line text-label">
              {s.text}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
