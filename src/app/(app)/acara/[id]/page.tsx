import {
  ArrowLeftIcon,
  ArrowRightIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleXIcon,
  ClipboardListIcon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LayersIcon,
  LinkIcon,
  LockKeyholeIcon,
  PaperclipIcon,
  PauseCircleIcon,
  RotateCcwIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SubmissionForm } from "@/app/(app)/acara/[id]/_components/submission-form";
import { EnrollButton } from "@/app/(app)/materi/_components/enroll-button";
import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { FileItem } from "@/components/ui/file-item";
import { IconBox } from "@/components/ui/icon-box";
import { InfoBox } from "@/components/ui/info-box";
import { initialsOf } from "@/components/ui/org-logo";
import { Progress } from "@/components/ui/progress";
import { WebLink } from "@/components/ui/web-link";
import { db } from "@/lib/db";
import { COVER_CLASS } from "@/lib/event-cover";
import { finalScore } from "@/lib/event-rules";
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatScore,
  formatTime,
} from "@/lib/format";
import { formatDuration, materialCover } from "@/lib/material-rules";
import { requireParticipant } from "@/lib/participant-access";
import { loadWorkspace, type MilestoneView } from "@/lib/participant-workspace";
import {
  filesOfSubmission,
  parseMilestoneInstructions,
  parseRevisionFocusPoints,
} from "@/lib/submission-helpers";
import { cn } from "@/lib/utils";
import { formatLabels, type submissionFormats } from "@/lib/validations/event";

export const metadata: Metadata = { title: "Ruang kerja acara" };

type Format = (typeof submissionFormats)[number];

function stepStatus(
  m: MilestoneView,
  prev: MilestoneView | undefined,
  opts: { paused: boolean; readOnly: boolean },
) {
  if (m.locked) {
    if (!opts.paused && opts.readOnly) {
      return { label: "Ditutup", state: "locked" as const };
    }
    if (prev?.latest && prev.survey && !prev.surveyDone) {
      return {
        label: `Isi survei milestone ${prev.order}`,
        state: "locked" as const,
      };
    }
    return {
      label: `Milestone ${m.order} · Terkunci`,
      state: "locked" as const,
    };
  }
  if (m.latest?.status === "REVISION_REQUESTED") {
    return m.revisionOverdue
      ? { label: "Batas revisi lewat", state: "overdue" as const }
      : { label: "Revisi", state: "revision" as const };
  }
  if (m.latest?.status === "GRADED") {
    return { label: "Dinilai", state: "done" as const };
  }
  if (m.latest) {
    return {
      label:
        m.latest.version > 1
          ? `Versi ${m.latest.version} dikirim`
          : "Tugas dikumpulkan",
      state: "done" as const,
    };
  }
  if (opts.paused) {
    return { label: "Dijeda", state: "revision" as const };
  }
  if (opts.readOnly) {
    return { label: "Tidak dikumpulkan", state: "overdue" as const };
  }
  if (m.overdue) {
    return { label: "Tenggat terlewat", state: "overdue" as const };
  }
  if (m.draft) {
    return { label: "Draf tersimpan", state: "active" as const };
  }
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
  const nextMilestone = current
    ? (milestones[current.index + 1] ?? null)
    : null;
  const percent =
    milestones.length === 0
      ? 0
      : Math.round((ws.submittedCount / milestones.length) * 100);
  const isTeam = event.participantType === "TEAM";
  const team = ws.enrollment.team;
  const allGraded =
    milestones.length > 0 &&
    milestones.every((m) => m.latest?.status === "GRADED" && m.latest.grade);
  const eventFinal = allGraded
    ? finalScore(milestones.map((m) => m.latest?.grade?.score ?? null))
    : null;
  const belowKkm = eventFinal !== null && eventFinal < event.kkm;
  const showClosedFormBox = Boolean(
    current &&
    !current.canSubmit &&
    !current.latest &&
    (current.overdue || ws.readOnly),
  );
  const activeRevision =
    current?.latest?.status === "REVISION_REQUESTED"
      ? current.latest.revisionRequest
      : null;
  const activeRevisionFocuses = activeRevision
    ? parseRevisionFocusPoints(activeRevision.focusPoints)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/beranda"
        className="inline-flex w-fit items-center gap-1.5 text-small text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Beranda / Acara Saya / Ruang Kerja
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-overline text-primary-500 uppercase">
            {event.field?.name ?? "Umum"} /{" "}
            {isTeam ? "Acara tim" : "Milestone berurutan"}
          </p>
          <h1 className="text-display text-foreground">{event.title}</h1>
          <p className="text-small text-muted-foreground">
            {ws.paused ? `${event.organization.name} · ` : ""}
            Guru: {event.creator.name}
            {event.startsAt && event.endsAt
              ? ` · ${formatDate(event.startsAt)} – ${formatDate(event.endsAt)}`
              : ""}
            {team ? ` · ${team.name}` : ""}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 lg:w-64">
          <div className="flex items-center justify-between">
            <span className="text-caption text-label">Tugas dikumpulkan</span>
            <span className="text-h2 text-primary-500">{percent}%</span>
          </div>
          <Progress value={percent} />
          <span className="text-caption text-muted-foreground">
            {ws.submittedCount} dari {milestones.length} tugas milestone
          </span>
        </div>
      </header>

      {ws.paused && (
        <Alert
          tone="warning"
          icon={PauseCircleIcon}
          title="Acara dijeda sementara"
        >
          Penyelenggara {event.organization.name} sedang dinonaktifkan oleh
          Administrator. Pengumpulan ditutup sampai organisasi aktif kembali.
          Nilai, karya, dan sertifikat yang sudah terbit tetap tersimpan di
          Portofolio.
        </Alert>
      )}
      {!ws.paused && ws.readOnly && (
        <Alert
          tone="warning"
          icon={ClockIcon}
          title={
            event.endsAt
              ? `Acara telah berakhir pada ${formatDate(event.endsAt)}`
              : "Acara telah berakhir"
          }
        >
          Ruang kerja kini hanya-baca. Milestone yang belum dikumpulkan tidak
          dapat dinilai, sehingga sertifikat tidak terbit. Riwayat acara tetap
          tersimpan di Portofolio.
        </Alert>
      )}
      {!ws.readOnly && current && !current.latest && current.overdue && (
        <Alert
          tone="danger"
          title={
            current.dueAt
              ? `Tenggat Milestone ${current.order} berakhir ${formatDateTime(current.dueAt)} WIB`
              : `Tenggat Milestone ${current.order} terlewat`
          }
        >
          Pengumpulan sudah ditutup dan tugas tercatat tidak dikumpulkan.
          Hubungi guru jika membutuhkan perpanjangan tenggat.
        </Alert>
      )}
      {!ws.started && !ws.readOnly && event.startsAt && (
        <Alert tone="info" icon={CalendarClockIcon}>
          Acara dimulai {formatDateTime(event.startsAt)} WIB. Milestone 1
          terbuka otomatis saat acara dimulai.
        </Alert>
      )}

      <nav
        className="flex gap-6 border-b border-border"
        aria-label="Bagian ruang kerja"
      >
        <Link
          href={`/acara/${id}`}
          aria-current={tab === "milestone" ? "page" : undefined}
          className={cn(
            "-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-body-medium transition-colors",
            tab === "milestone"
              ? "border-primary-500 font-semibold text-primary-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Milestone
        </Link>
        <Link
          href={`/acara/${id}?tab=materi`}
          aria-current={tab === "materi" ? "page" : undefined}
          className={cn(
            "-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-body-medium transition-colors",
            tab === "materi"
              ? "border-primary-500 font-semibold text-primary-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Materi pendukung
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-caption-strong",
              tab === "materi"
                ? "bg-primary-50 text-primary-600"
                : "bg-muted text-label",
            )}
          >
            {event.materials.length}
          </span>
        </Link>
      </nav>

      {tab === "materi" ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <IconBox icon={PaperclipIcon} tone="primary" size="sm" />
            <div className="flex flex-col gap-0.5">
              <h2 className="text-h3 text-foreground">
                Materi pendukung dari Trainer
              </h2>
              <p className="text-small text-muted-foreground">
                Opsional — tidak memengaruhi milestone, tenggat, maupun nilai
                acara.
              </p>
            </div>
          </div>

          {event.materials.length === 0 ? (
            <p className="rounded-xl bg-background p-6 text-center text-small text-muted-foreground">
              Guru belum menautkan materi pendukung pada acara ini.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {event.materials.map(({ material }) => {
                const e = materialProgress.get(material.id);
                const minutes = material.sections.reduce(
                  (s, x) => s + (x.durationMinutes ?? 0),
                  0,
                );
                return (
                  <article
                    key={material.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl",
                        COVER_CLASS[materialCover(material.coverColor)],
                      )}
                    >
                      <BookOpenIcon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <h3 className="text-h3 text-foreground">
                        {material.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-label">
                        <span>{material.trainer.name} (Trainer)</span>
                        <span className="inline-flex items-center gap-1.5">
                          <LayersIcon
                            aria-hidden="true"
                            className="size-3.5 text-muted-foreground"
                          />
                          {material.sections.length} bagian
                        </span>
                        {minutes > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <ClockIcon
                              aria-hidden="true"
                              className="size-3.5 text-muted-foreground"
                            />
                            {formatDuration(minutes)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                      {e ? (
                        <>
                          <div className="flex w-full flex-col gap-1 sm:w-32">
                            <div className="flex justify-between text-small-strong text-primary-500">
                              <span>
                                {e.completedAt ? "Selesai" : "Diikuti"}
                              </span>
                              <span>{e.progress}%</span>
                            </div>
                            <Progress
                              value={e.progress}
                              label={`Progres ${material.title}`}
                            />
                          </div>
                          <Link
                            href={`/materi/${material.id}`}
                            className={buttonVariants({
                              variant: e.completedAt ? "secondary" : "primary",
                              className: "w-fit shrink-0",
                            })}
                          >
                            {e.completedAt ? "Buka lagi" : "Lanjutkan"}
                            <ArrowRightIcon aria-hidden="true" />
                          </Link>
                        </>
                      ) : (
                        <>
                          <Badge tone="neutral" className="w-fit">
                            Belum diikuti
                          </Badge>
                          {material.status === "PUBLISHED" && !ws.paused && (
                            <EnrollButton
                              materialId={material.id}
                              className="w-fit shrink-0"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <Alert tone="info">
            Materi yang diikuti dari acara tercatat di Riwayat belajar, sama
            seperti materi dari Jelajah.
          </Alert>
        </section>
      ) : current ? (
        <>
          <ol className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card p-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m, idx) => {
              const s = stepStatus(m, milestones[idx - 1], {
                paused: ws.paused,
                readOnly: ws.readOnly,
              });
              const active = m.id === current.id;
              const body = (
                <>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-caption-strong",
                      s.state === "locked" && "bg-muted text-subtle",
                      s.state === "done" && "bg-success-100 text-success-600",
                      s.state === "revision" &&
                        "bg-warning-100 text-warning-700",
                      s.state === "overdue" && "bg-danger-100 text-danger-600",
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
                          : active
                            ? "text-primary-500"
                            : "text-foreground",
                      )}
                    >
                      {m.title}
                    </span>
                    <span
                      className={cn(
                        "truncate",
                        s.state === "done"
                          ? "text-success-600"
                          : s.state === "revision"
                            ? "text-warning-700"
                            : s.state === "overdue"
                              ? "text-danger-500"
                              : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </span>
                </>
              );
              const cls = cn(
                "flex items-center gap-2.5 rounded-lg border p-2.5",
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
              <MilestoneState
                m={current}
                eventId={id}
                creatorName={event.creator.name}
                creatorAvatarFileId={event.creator.avatarFileId}
                nextMilestone={nextMilestone}
                readOnly={ws.readOnly}
              />
              {current.canSubmit && (
                <SubmissionForm
                  key={`${current.id}-${current.latest?.version ?? 0}`}
                  milestoneId={current.id}
                  order={current.order}
                  formats={current.formats as string[]}
                  revision={current.latest?.status === "REVISION_REQUESTED"}
                  eventTitle={event.title}
                  milestoneTitle={current.title}
                  nextVersion={(current.latest?.version ?? 0) + 1}
                  hasSurvey={Boolean(current.survey)}
                  hasNextMilestone={Boolean(nextMilestone)}
                  initialDraft={
                    current.draft
                      ? {
                          files: current.draft.files.map((item) => item.file),
                          link: current.draft.link ?? "",
                          text: current.draft.text ?? "",
                          revisionNote: current.draft.revisionNote ?? "",
                          updatedAt: current.draft.updatedAt.toISOString(),
                        }
                      : null
                  }
                />
              )}
              {showClosedFormBox && (
                <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-h2 text-foreground">
                      Pengumpulan tugas ditutup
                    </h2>
                    <p className="text-small text-muted-foreground">
                      {ws.paused
                        ? "Pengumpulan dibuka kembali otomatis saat organisasi penyelenggara diaktifkan."
                        : ws.readOnly
                          ? "Pengumpulan ditutup karena acara telah berakhir."
                          : current.dueAt
                            ? `Pengumpulan ditutup sejak ${formatDateTime(current.dueAt)} WIB.`
                            : "Tenggat pengumpulan telah terlewat."}
                    </p>
                  </div>
                  <Button type="button" size="lg" disabled className="w-fit">
                    {ws.paused
                      ? "Acara dijeda"
                      : ws.readOnly
                        ? "Acara telah berakhir"
                        : "Pengumpulan ditutup"}
                  </Button>
                </section>
              )}
              {current.submissions.length > 0 && <History m={current} />}
            </div>
            <aside className="flex flex-col gap-4">
              {team && (
                <section className="flex flex-col gap-3 rounded-xl bg-primary-50 p-5">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-overline text-tone-navy-fg uppercase">
                      Anggota tim · {team.members.length} orang
                    </p>
                    <h2 className="text-h2 text-tone-navy-fg">{team.name}</h2>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {team.members.map((member) => {
                      const memberIsLeader = member.userId === team.leaderId;
                      const isSelf = member.userId === user.id;
                      return (
                        <li
                          key={member.userId}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Avatar size="sm">
                              {member.user.avatarFileId && (
                                <AvatarImage
                                  src={`/api/files/${member.user.avatarFileId}`}
                                  alt={member.user.name}
                                />
                              )}
                              <AvatarFallback>
                                {initialsOf(member.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-small-strong text-label">
                              {member.user.name}
                            </span>
                          </span>
                          <Badge
                            size="sm"
                            tone={memberIsLeader ? "primary" : "neutral"}
                          >
                            {memberIsLeader
                              ? "Ketua"
                              : isSelf
                                ? "Anda"
                                : "Anggota"}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                  {team.leaderId === user.id ? (
                    ws.started ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled
                          className="w-full"
                        >
                          Keluarkan anggota
                        </Button>
                        <p className="text-caption text-muted-foreground">
                          Acara sudah dimulai, jadi anggota tidak dapat
                          dikeluarkan.
                        </p>
                      </>
                    ) : (
                      <Link
                        href={`/jelajah/${event.id}`}
                        className={buttonVariants({
                          variant: "secondary",
                          className: "w-full",
                        })}
                      >
                        Kelola anggota tim
                      </Link>
                    )
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      Hanya ketua kelompok yang dapat mengelola anggota.
                    </p>
                  )}
                </section>
              )}

              {activeRevision?.dueAt ? (
                <section
                  className={cn(
                    "flex flex-col gap-1 rounded-xl p-5",
                    current.revisionOverdue
                      ? "border border-danger-200 bg-danger-50"
                      : "bg-primary-50",
                  )}
                >
                  <p
                    className={cn(
                      "text-body-strong",
                      current.revisionOverdue
                        ? "text-danger-700"
                        : "text-tone-navy-fg",
                    )}
                  >
                    Batas pengiriman revisi
                  </p>
                  <p
                    className={cn(
                      "text-display",
                      current.revisionOverdue
                        ? "text-danger-700"
                        : "text-foreground",
                    )}
                  >
                    {formatDate(activeRevision.dueAt)}
                  </p>
                  <p className="text-body text-muted-foreground">
                    Pukul {formatTime(activeRevision.dueAt)}
                  </p>
                  <p className="pt-1 text-caption text-muted-foreground">
                    {current.revisionOverdue
                      ? "Batas revisi telah terlewat. Pengiriman ulang ditutup."
                      : `Batas revisi ini menggantikan tenggat pengumpulan awal untuk milestone ${current.order}.`}
                  </p>
                </section>
              ) : (
                <section className="flex flex-col gap-1 rounded-xl bg-primary-50 p-5">
                  <p className="text-body-strong text-tone-navy-fg">
                    Tenggat milestone {current.order}
                  </p>
                  {current.dueAt ? (
                    <>
                      <p className="text-h2 text-tone-navy-fg">
                        {formatDate(current.dueAt)}
                      </p>
                      <p className="text-body text-muted-foreground">
                        Pukul {formatTime(current.dueAt)}
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
              )}

              {activeRevision && activeRevisionFocuses.length > 0 && (
                <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-h3 text-foreground">
                      Cek kembali perbaikan
                    </h2>
                    <p className="text-caption text-muted-foreground">
                      Catatan {activeRevision.requestedBy.name} ·{" "}
                      {formatDateTime(activeRevision.createdAt)} WIB
                    </p>
                  </div>
                  <ol className="flex flex-col gap-2 text-small text-muted-foreground">
                    {activeRevisionFocuses.map((fp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-small-strong text-primary-600">
                          {idx + 1}.
                        </span>
                        <span className="text-label">{fp.title}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {current.survey && (
                <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5">
                  <h2 className="text-h3 text-foreground">
                    Langkah berikutnya: survei
                  </h2>
                  {current.surveyDone ? (
                    <Badge tone="success" className="w-fit">
                      Sudah terkirim
                    </Badge>
                  ) : current.latest ? (
                    <Badge tone="warning" className="w-fit">
                      <ClipboardListIcon aria-hidden="true" />
                      Belum diisi
                    </Badge>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-caption text-subtle">
                      <LockKeyholeIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                      Belum tersedia
                    </p>
                  )}
                  <p className="text-small text-muted-foreground">
                    {current.latest && !current.surveyDone
                      ? `Tugas sudah dikumpulkan. Isi survei milestone ${current.order} untuk melanjutkan ke milestone berikutnya.`
                      : `Survei milestone ${current.order} terbuka setelah tugas dikumpulkan. Setelah survei dikirim, milestone berikutnya terbuka otomatis.`}
                  </p>
                  <p className="text-caption text-subtle">
                    Anda tidak perlu menunggu penilaian guru untuk melanjutkan
                    milestone.
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
                  <h2 className="text-h3 text-foreground">
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
                <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-foreground">
                    <AwardIcon
                      aria-hidden="true"
                      className="size-5 text-primary-500"
                    />
                    <h2 className="text-h3">Sertifikat tersedia</h2>
                  </div>
                  <p className="text-small text-muted-foreground">
                    Nilai akhir{" "}
                    {formatScore(ws.enrollment.certificate.finalScore)} memenuhi
                    KKM {event.kkm}.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/sertifikat/${ws.enrollment.certificate.number}`}
                      className={buttonVariants({ className: "w-full" })}
                    >
                      Lihat sertifikat
                      <ArrowRightIcon aria-hidden="true" />
                    </Link>
                    <a
                      href={`/api/sertifikat/${encodeURIComponent(ws.enrollment.certificate.number)}/pdf`}
                      className={buttonVariants({
                        variant: "secondary",
                        className: "w-full",
                      })}
                    >
                      Unduh PDF
                      <DownloadIcon aria-hidden="true" />
                    </a>
                  </div>
                </section>
              ) : belowKkm ? (
                <>
                  <section className="flex flex-col gap-3 rounded-2xl bg-danger-700 p-5 text-inverse">
                    <p className="text-overline text-primary-100 uppercase">
                      Nilai akhir acara
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-hero">
                        {formatScore(eventFinal)}
                      </span>
                      <span className="text-body text-primary-100">/ 100</span>
                    </div>
                    <Badge tone="danger" className="w-fit">
                      Di bawah KKM
                    </Badge>
                    <p className="text-small text-inverse/90">
                      Rata-rata seluruh milestone · KKM {event.kkm}
                    </p>
                  </section>
                  {event.certificateEnabled && (
                    <section className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-card p-5">
                      <IconBox icon={CircleXIcon} tone="danger" size="md" />
                      <h2 className="text-h3 text-foreground">
                        Sertifikat tidak terbit
                      </h2>
                      <p className="text-small text-muted-foreground">
                        Sertifikat hanya terbit jika nilai akhir mencapai KKM (
                        {event.kkm}). Nilai sudah final dan tidak dapat diubah.
                      </p>
                      <Link
                        href="/jelajah"
                        className={buttonVariants({ className: "w-full" })}
                      >
                        Jelajah acara lain
                      </Link>
                    </section>
                  )}
                </>
              ) : (
                event.certificateEnabled && (
                  <section className="flex flex-col gap-1 rounded-xl bg-muted p-5">
                    <h2 className="text-body-strong text-foreground">
                      Sertifikat otomatis
                    </h2>
                    <p className="text-caption text-muted-foreground">
                      Seluruh milestone selesai, seluruh nilai terbit, dan nilai
                      akhir minimal {event.kkm}. Tersimpan di portofolio acara.
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
  const { intro, checklist } = parseMilestoneInstructions(m.instructions);
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-overline text-primary-500 uppercase">
        Milestone {String(m.order).padStart(2, "0")}
      </p>
      <h2 className="text-display text-foreground">{m.title}</h2>
      {intro && (
        <p className="text-body whitespace-pre-line text-label">{intro}</p>
      )}
      {checklist.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-xl bg-background p-4">
          <h3 className="text-small-strong text-label">
            Yang perlu ada pada hasil tugas
          </h3>
          <ol className="flex flex-col gap-2">
            {checklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-small">
                <span className="text-caption-strong text-subtle">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ol>
        </div>
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
  creatorName,
  creatorAvatarFileId,
  nextMilestone,
  readOnly,
}: {
  m: MilestoneView;
  eventId: string;
  creatorName: string;
  creatorAvatarFileId: string | null;
  nextMilestone: MilestoneView | null;
  readOnly: boolean;
}) {
  const latest = m.latest;
  if (latest?.status === "REVISION_REQUESTED" && latest.revisionRequest) {
    const focusPoints = parseRevisionFocusPoints(
      latest.revisionRequest.focusPoints,
    );
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-warning-200 bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-display text-foreground">Revisi diminta</h2>
            <p className="text-h3 text-label">
              Milestone {m.order} · {m.title}
            </p>
          </div>
          <Badge tone={m.revisionOverdue ? "danger" : "warning"}>
            <RotateCcwIcon aria-hidden="true" />
            {m.revisionOverdue ? "Batas revisi terlewat" : "Revisi"}
          </Badge>
        </div>
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            {latest.revisionRequest.requestedBy.avatarFileId && (
              <AvatarImage
                src={`/api/files/${latest.revisionRequest.requestedBy.avatarFileId}`}
                alt={latest.revisionRequest.requestedBy.name}
              />
            )}
            <AvatarFallback>
              {initialsOf(latest.revisionRequest.requestedBy.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-body-strong text-label">
              {latest.revisionRequest.requestedBy.name}
            </span>
            <span className="text-caption text-muted-foreground">
              {formatDateTime(latest.revisionRequest.createdAt)} WIB
            </span>
          </div>
        </div>
        <blockquote className="rounded-xl bg-background p-4 text-body whitespace-pre-line text-label">
          {latest.revisionRequest.note}
        </blockquote>
        {focusPoints.length > 0 && (
          <div className="flex flex-col gap-3 pt-1">
            <h3 className="text-h3 text-foreground">Fokus perbaikan Anda</h3>
            <ol className="flex flex-col gap-2.5">
              {focusPoints.map((fp, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-caption-strong text-primary-600">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-body-strong text-label">{fp.title}</p>
                    {fp.detail && (
                      <p className="text-small text-muted-foreground">
                        {fp.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {m.revisionOverdue && latest.revisionRequest.dueAt && (
          <Alert
            tone="danger"
            title={`Batas pengiriman revisi berakhir ${formatDateTime(latest.revisionRequest.dueAt)} WIB`}
          >
            Waktu kirim ulang revisi sudah terlewat sehingga unggah ulang
            ditutup. Pengumpulan versi sebelumnya tetap tersimpan untuk dinilai
            oleh guru.
          </Alert>
        )}
      </section>
    );
  }
  if (latest?.status === "GRADED" && latest.grade) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h2 text-foreground">
                Penilaian versi {latest.version}
              </h2>
              <Badge tone="success" size="sm">
                Sudah dinilai
              </Badge>
            </div>
            <p className="text-caption text-muted-foreground">
              Dikirim {formatDateTime(latest.submittedAt)} WIB
            </p>
          </div>
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
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-h3 text-foreground">
              Umpan balik guru · milestone ini
            </p>
            <div className="flex items-center gap-2.5">
              <Avatar size="sm">
                {creatorAvatarFileId && (
                  <AvatarImage
                    src={`/api/files/${creatorAvatarFileId}`}
                    alt={creatorName}
                  />
                )}
                <AvatarFallback>{initialsOf(creatorName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-small-strong text-label">
                  {creatorName}
                </span>
                <span className="text-caption text-muted-foreground">
                  Versi {latest.version}
                </span>
              </div>
            </div>
            <blockquote className="rounded-xl bg-background p-4 text-body whitespace-pre-line text-label">
              {latest.grade.feedback}
            </blockquote>
          </div>
        )}
        {m.survey && !m.surveyDone && !readOnly && (
          <div className="flex flex-col gap-3 rounded-xl bg-primary-50 p-4">
            <p className="text-h3 text-foreground">
              Satu langkah lagi untuk lanjut
            </p>
            <p className="text-small text-muted-foreground">
              Isi survei pengalaman belajar milestone {m.order}
              {nextMilestone
                ? ` untuk membuka Milestone ${nextMilestone.order} — ${nextMilestone.title}`
                : ""}
              .
            </p>
            <Button
              className="w-fit"
              nativeButton={false}
              render={<Link href={`/acara/${eventId}/survei/${m.id}`} />}
            >
              Isi survei milestone {m.order}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        )}
      </section>
    );
  }
  if (latest) {
    const needsSurvey = m.survey && !m.surveyDone;
    const isRevisionSubmission = latest.version > 1;
    const latestFiles = filesOfSubmission(latest);
    if (isRevisionSubmission) {
      return (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
              <CheckCircle2Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-display text-foreground">
                Revisi berhasil dikirim
              </h2>
              <p className="text-small text-muted-foreground">
                Milestone {m.order} · {m.title} · Versi {latest.version}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-h2 text-foreground">
              Menunggu hasil pemeriksaan
            </h3>
            <p className="text-body text-muted-foreground">
              Versi terbaru sudah diterima dan akan diperiksa oleh {creatorName}
              . Hasil pemeriksaan dan permintaan perbaikan lanjutan akan muncul
              melalui notifikasi.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-3 rounded-xl bg-background p-4 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <dt className="text-small text-muted-foreground">Dikirim pada</dt>
              <dd className="text-small-strong text-label">
                {formatDateTime(latest.submittedAt)} WIB
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-small text-muted-foreground">
                Versi terbaru
              </dt>
              <dd className="text-small-strong text-label">
                Versi {latest.version}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-small text-muted-foreground">
                Nilai terbaru
              </dt>
              <dd className="text-small-strong text-label">—</dd>
            </div>
          </dl>
          {latestFiles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {latestFiles.map((file) => (
                <FileItem
                  key={file.id}
                  name={file.name}
                  meta={`Versi ${latest.version} · ${formatFileSize(file.size)}`}
                  kind={
                    file.contentType.startsWith("image/") ? "image" : "file"
                  }
                  action={
                    <a
                      href={`/api/files/${file.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Buka berkas
                      <ExternalLinkIcon aria-hidden="true" />
                    </a>
                  }
                />
              ))}
            </div>
          ) : (
            latest.link && (
              <div className="flex flex-col gap-3 rounded-xl bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <IconBox icon={LinkIcon} tone="primary" size="sm" />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-caption-strong text-muted-foreground">
                      Tautan karya (Versi {latest.version})
                    </span>
                    <span className="truncate text-small-strong text-foreground">
                      {latest.link}
                    </span>
                  </div>
                </div>
                <WebLink
                  href={latest.link}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                    className: "w-fit shrink-0",
                  })}
                >
                  Buka tautan
                  <ExternalLinkIcon aria-hidden="true" />
                </WebLink>
              </div>
            )
          )}
          {latest.revisionNote && (
            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <h3 className="text-body-strong text-label">
                Catatan revisi Anda
              </h3>
              <p className="text-body whitespace-pre-line text-muted-foreground">
                {latest.revisionNote}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Link
              href="/beranda"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Kembali ke beranda
            </Link>
            {nextMilestone && !nextMilestone.locked && (
              <Link
                href={`/acara/${eventId}?m=${nextMilestone.order}`}
                className={buttonVariants({ size: "lg" })}
              >
                Lanjut ke milestone {nextMilestone.order}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <CheckCircle2Icon
              aria-hidden="true"
              className="size-5 shrink-0 text-success-500"
            />
            <h2 className="text-h2 text-foreground">
              Tugas milestone {m.order} sudah dikumpulkan
            </h2>
          </div>
          <p className="text-small text-muted-foreground">
            Dikumpulkan pada {formatDateTime(latest.submittedAt)} WIB
          </p>
        </div>
        {latestFiles.length > 0 ? (
          <div className="flex flex-col gap-2">
            {latestFiles.map((file) => (
              <FileItem
                key={file.id}
                name={file.name}
                meta={formatFileSize(file.size)}
                kind={file.contentType.startsWith("image/") ? "image" : "file"}
                action={
                  <a
                    href={`/api/files/${file.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                    })}
                  >
                    Buka berkas
                    <ExternalLinkIcon aria-hidden="true" />
                  </a>
                }
              />
            ))}
          </div>
        ) : (
          latest.link && (
            <div className="flex flex-col gap-3 rounded-xl bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <IconBox icon={LinkIcon} tone="primary" size="sm" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-caption-strong text-muted-foreground">
                    Tautan karya
                  </span>
                  <span className="truncate text-small-strong text-foreground">
                    {latest.link}
                  </span>
                </div>
              </div>
              <WebLink
                href={latest.link}
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "w-fit shrink-0",
                })}
              >
                Buka tautan
                <ExternalLinkIcon aria-hidden="true" />
              </WebLink>
            </div>
          )
        )}
        {needsSurvey && !readOnly && (
          <div className="flex flex-col gap-3 rounded-xl bg-primary-50 p-5">
            <h3 className="text-h2 text-foreground">
              Satu langkah lagi untuk lanjut
            </h3>
            <p className="text-body text-muted-foreground">
              Isi survei pengalaman belajar milestone {m.order}
              {nextMilestone
                ? ` untuk membuka Milestone ${nextMilestone.order} — ${nextMilestone.title}`
                : ""}
              .
            </p>
            <Button
              size="lg"
              className="w-fit"
              nativeButton={false}
              render={<Link href={`/acara/${eventId}/survei/${m.id}`} />}
            >
              Isi survei milestone {m.order}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        )}
        <p className="text-small text-muted-foreground">
          Nilai tugas: — · Hasil penilaian akan tersedia melalui notifikasi.
        </p>
      </section>
    );
  }
  return null;
}

function History({ m }: { m: MilestoneView }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-h2 text-foreground">Riwayat pengumpulan</h2>
        <span className="text-small text-muted-foreground">
          {m.submissions.length} versi
        </span>
      </div>
      {m.submissions.map((s) => {
        const subFiles = filesOfSubmission(s);
        return (
          <div
            key={s.id}
            className="flex flex-col gap-2 rounded-xl bg-background p-3.5"
          >
            <p className="text-caption-strong text-label">
              Versi {s.version} · {formatDateTime(s.submittedAt)} WIB ·{" "}
              {s.status === "GRADED"
                ? `Dinilai (${s.grade ? formatScore(s.grade.score) : "—"})`
                : s.status === "REVISION_REQUESTED"
                  ? "Revisi diminta"
                  : "Menunggu pemeriksaan"}
            </p>
            {subFiles.map((file) => (
              <FileItem
                key={file.id}
                name={file.name}
                meta={formatFileSize(file.size)}
                kind={file.contentType.startsWith("image/") ? "image" : "file"}
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
            ))}
            {s.link && (
              <WebLink
                href={s.link}
                className="truncate text-small text-primary-600 underline"
              />
            )}
            {s.text && (
              <p className="text-small whitespace-pre-line text-label">
                {s.text}
              </p>
            )}
            {s.revisionNote && (
              <p className="rounded-lg bg-card p-3 text-small whitespace-pre-line text-muted-foreground">
                <span className="font-semibold text-label">
                  Catatan revisi:{" "}
                </span>
                {s.revisionNote}
              </p>
            )}
            {s.revisionRequest && (
              <p className="text-caption text-warning-700">
                Arahan revisi {s.revisionRequest.requestedBy.name}:{" "}
                {s.revisionRequest.note}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
