import {
  ArrowRightIcon,
  AwardIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClipboardCheckIcon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HistoryIcon,
  ImageIcon,
  InfoIcon,
  ListChecksIcon,
  Maximize2Icon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { InfoBox } from "@/components/ui/info-box";
import { initialsOf } from "@/components/ui/org-logo";
import { WebLink } from "@/components/ui/web-link";
import { db } from "@/lib/db";
import { finalScore } from "@/lib/event-rules";
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatScore,
} from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { filesOfSubmission } from "@/lib/submission-helpers";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail karya & hasil penilaian" };

function fileTypeLabel(contentType: string) {
  if (contentType === "application/pdf") return "PDF";
  if (contentType === "image/png") return "PNG";
  if (contentType === "image/jpeg") return "JPG";
  return "Berkas";
}

export default async function PortfolioEventDetailPage({
  params,
  searchParams,
}: PageProps<"/portofolio/[eventId]">) {
  const user = await requirePermission("event:join");
  const { eventId } = await params;
  const sp = await searchParams;

  const enrollment = await db.enrollment.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
    include: {
      certificate: {
        select: { number: true, finalScore: true, issuedAt: true },
      },
      event: {
        select: {
          id: true,
          title: true,
          status: true,
          endsAt: true,
          kkm: true,
          certificateEnabled: true,
          creator: { select: { name: true } },
          milestones: {
            orderBy: { order: "asc" },
            include: {
              survey: {
                select: {
                  id: true,
                  responses: {
                    where: { userId: user.id },
                    select: { id: true },
                  },
                },
              },
              submissions: {
                where: { userId: user.id },
                orderBy: { version: "desc" },
                include: {
                  file: {
                    select: {
                      id: true,
                      name: true,
                      size: true,
                      contentType: true,
                    },
                  },
                  files: {
                    orderBy: { position: "asc" },
                    include: {
                      file: {
                        select: {
                          id: true,
                          name: true,
                          size: true,
                          contentType: true,
                        },
                      },
                    },
                  },
                  grade: {
                    include: {
                      grader: { select: { name: true, avatarFileId: true } },
                      scores: {
                        include: {
                          criterion: { select: { name: true, order: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment || enrollment.event.status === "DRAFT") notFound();

  const { event, certificate } = enrollment;
  const milestones = event.milestones.map((m) => ({
    ...m,
    latest: m.submissions[0] ?? null,
    surveyDone: Boolean(m.survey?.responses.length),
  }));

  const totalMilestones = milestones.length;
  const submittedCount = milestones.filter((m) => Boolean(m.latest)).length;
  const gradedCount = milestones.filter(
    (m) => m.latest?.status === "GRADED" && m.latest.grade,
  ).length;
  const surveyDoneCount = milestones.filter((m) => m.surveyDone).length;
  const allGraded = totalMilestones > 0 && gradedCount === totalMilestones;
  const scores = milestones.map((m) => m.latest?.grade?.score ?? null);
  const eventFinal = allGraded ? finalScore(scores) : null;
  const belowKkm = eventFinal !== null && eventFinal < event.kkm;

  const requestedOrder = Number(sp.m);
  const current =
    milestones.find((m) => m.order === requestedOrder) ?? milestones[0] ?? null;
  const latest = current?.latest ?? null;
  const latestFiles = latest ? filesOfSubmission(latest) : [];
  const previewFile =
    latestFiles.find(
      (file) =>
        file.contentType.startsWith("image/") ||
        file.contentType === "application/pdf",
    ) ?? null;
  const isImageFile = Boolean(previewFile?.contentType.startsWith("image/"));
  const isPdfFile = previewFile?.contentType === "application/pdf";
  const numericScores = scores.filter((s): s is number => s !== null);
  const scoreFormula =
    allGraded && eventFinal !== null && numericScores.length > 0
      ? `(${numericScores.map((s) => formatScore(s)).join(" + ")}) ÷ ${numericScores.length} = ${formatScore(eventFinal)}`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/portofolio" className="hover:text-foreground">
          Portofolio pribadi
        </Link>{" "}
        / {event.title} / Hasil penilaian
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-display text-foreground">{event.title}</h1>
          <p className="text-small text-muted-foreground">
            {user.name} · Peserta &nbsp;/&nbsp; Guru: {event.creator.name}
            {event.endsAt ? ` / ${formatDate(event.endsAt)}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!allGraded && (
            <Link
              href={`/acara/${event.id}`}
              className={buttonVariants({ size: "lg" })}
            >
              Buka ruang kerja
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          )}
          <Link
            href="/portofolio"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Kembali ke portofolio
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-5 rounded-2xl bg-primary-50 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <p className="text-overline text-primary-500 uppercase">
            {allGraded ? "Hasil penilaian lengkap" : "Ringkasan penilaian"}
          </p>
          <h2 className="text-display text-foreground">
            {allGraded
              ? belowKkm
                ? "Nilai akhir belum mencapai KKM"
                : "Seluruh milestone sudah dinilai"
              : "Penilaian masih berlangsung"}
          </h2>
          <p className="text-body text-muted-foreground">
            {allGraded
              ? belowKkm
                ? `Nilai akhir ${formatScore(eventFinal!)}, KKM ${event.kkm}. Sertifikat tidak terbit. Pelajari umpan balik guru untuk acara berikutnya.`
                : `Tinjau kembali nilai, bukti pekerjaan, dan umpan balik setiap milestone.${certificate ? " Sertifikat telah terbit otomatis." : ""}`
              : `${gradedCount} dari ${totalMilestones} milestone sudah dinilai. Nilai akhir tampil setelah seluruh milestone selesai dinilai.`}
          </p>
        </div>
        <ul className="flex flex-col gap-2.5 rounded-xl bg-card p-4 text-small text-label shadow-xs lg:w-64 lg:shrink-0">
          <li className="flex items-center gap-2.5">
            <CircleCheckIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-success-500"
            />
            {submittedCount} dari {totalMilestones} milestone selesai
          </li>
          <li className="flex items-center gap-2.5">
            <ClipboardCheckIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-primary-500"
            />
            {gradedCount} dari {totalMilestones} milestone dinilai
          </li>
          <li className="flex items-center gap-2.5">
            <ListChecksIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-primary-500"
            />
            {surveyDoneCount} survei terkirim
          </li>
        </ul>
      </section>

      {current && (
        <>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-h2 text-foreground">
              Rincian hasil tiap milestone
            </h2>
            <p className="text-small text-muted-foreground">
              Pilih milestone untuk meninjau hasil penilaian
            </p>
          </div>

          <nav
            aria-label="Pilih milestone"
            className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {milestones.map((m) => {
              const active = m.id === current.id;
              const score = m.latest?.grade?.score ?? null;
              return (
                <Link
                  key={m.id}
                  href={`/portofolio/${eventId}?m=${m.order}`}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 transition-colors outline-none focus-visible:shadow-focus-ring",
                    active
                      ? "border-primary-400 bg-primary-50"
                      : "border-border bg-card hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      m.latest
                        ? "bg-success-100 text-success-600"
                        : "bg-muted text-subtle",
                    )}
                  >
                    {m.latest ? (
                      <CheckIcon aria-hidden="true" className="size-4" />
                    ) : (
                      <ClockIcon aria-hidden="true" className="size-4" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-overline uppercase",
                        active ? "text-primary-500" : "text-muted-foreground",
                      )}
                    >
                      Milestone {String(m.order).padStart(2, "0")}
                    </span>
                    <span className="truncate text-body-strong text-label">
                      {m.title}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-h2",
                      score === null
                        ? "text-subtle"
                        : belowKkm
                          ? "text-danger-500"
                          : active
                            ? "text-primary-500"
                            : "text-label",
                    )}
                  >
                    {score === null ? "—" : formatScore(score)}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-display text-foreground">
                      {current.title}
                    </h3>
                    {latest?.status === "GRADED" ? (
                      <Badge tone="success">Sudah dinilai</Badge>
                    ) : latest?.status === "REVISION_REQUESTED" ? (
                      <Badge tone="warning">Revisi diminta</Badge>
                    ) : latest ? (
                      <Badge tone="primary">Menunggu penilaian</Badge>
                    ) : (
                      <Badge tone="neutral">Belum dikumpulkan</Badge>
                    )}
                  </div>
                  {current.instructions && (
                    <p className="text-body text-muted-foreground">
                      Milestone {current.order} · {current.instructions}
                    </p>
                  )}
                  {latest && (
                    <p className="text-caption text-muted-foreground">
                      Dikirim {formatDateTime(latest.submittedAt)} WIB · Versi{" "}
                      {latest.version}
                    </p>
                  )}
                </div>

                {!latest ? (
                  <div className="flex flex-col gap-3 rounded-xl bg-background p-5 text-small text-muted-foreground">
                    <p>
                      Belum ada bukti karya yang dikumpulkan pada milestone ini.
                    </p>
                    <Link
                      href={`/acara/${event.id}?m=${current.order}`}
                      className={buttonVariants({
                        variant: "secondary",
                        size: "sm",
                        className: "w-fit",
                      })}
                    >
                      Buka di ruang kerja
                      <ArrowRightIcon aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {latestFiles.length > 0 && (
                      <div className="flex flex-col gap-2.5">
                        {latestFiles.map((file) => {
                          const fileIsImage =
                            file.contentType.startsWith("image/");
                          return (
                            <div
                              key={file.id}
                              className="flex flex-col gap-3 rounded-xl bg-primary-50 p-4 sm:flex-row sm:items-center"
                            >
                              <IconBox
                                icon={fileIsImage ? ImageIcon : FileTextIcon}
                                tone="blue"
                                size="md"
                              />
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="text-caption-strong text-primary-500">
                                  Berkas Anda (dikumpulkan)
                                </span>
                                <span className="truncate text-body-strong text-label">
                                  {file.name}
                                </span>
                                <span className="text-caption text-muted-foreground">
                                  {fileTypeLabel(file.contentType)} ·{" "}
                                  {formatFileSize(file.size)} · Versi terbaru
                                </span>
                              </div>
                              <a
                                href={`/api/files/${file.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className={buttonVariants({
                                  variant: "secondary",
                                  className: "w-fit shrink-0",
                                })}
                              >
                                Unduh
                                <DownloadIcon aria-hidden="true" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {previewFile && (isImageFile || isPdfFile) && (
                      <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-small-strong text-text-secondary">
                            Pratinjau bukti karya
                          </span>
                          <a
                            href={`/api/files/${previewFile.id}?pratinjau=1`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Buka pratinjau penuh ${previewFile.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
                          >
                            <Maximize2Icon
                              aria-hidden="true"
                              className="size-4"
                            />
                          </a>
                        </div>
                        {isImageFile ? (
                          <div className="overflow-hidden rounded-lg border border-border bg-card">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/files/${previewFile.id}?pratinjau=1`}
                              alt={`Pratinjau ${previewFile.name}`}
                              className="max-h-96 w-full object-contain"
                            />
                          </div>
                        ) : (
                          <iframe
                            src={`/api/files/${previewFile.id}?pratinjau=1`}
                            title={`Pratinjau ${previewFile.name}`}
                            className="h-96 w-full rounded-lg border border-border bg-card"
                          />
                        )}
                        <p className="flex items-center gap-2 text-caption text-muted-foreground">
                          {isImageFile ? (
                            <ImageIcon
                              aria-hidden="true"
                              className="size-3.5 shrink-0"
                            />
                          ) : (
                            <FileTextIcon
                              aria-hidden="true"
                              className="size-3.5 shrink-0"
                            />
                          )}
                          <span className="truncate">
                            {previewFile.name} · Versi {latest.version}
                          </span>
                        </p>
                      </div>
                    )}

                    {(latest.link || latest.text || latest.revisionNote) && (
                      <div className="flex flex-col gap-2.5 rounded-xl bg-background p-4">
                        <p className="text-small-strong text-text-secondary">
                          Bukti karya lainnya
                        </p>
                        {latest.link && (
                          <WebLink
                            href={latest.link}
                            className="inline-flex items-center gap-1.5 text-small-strong break-all text-primary-600 underline"
                          />
                        )}
                        {latest.text && (
                          <p className="text-body whitespace-pre-line text-label">
                            {latest.text}
                          </p>
                        )}
                        {latest.revisionNote && (
                          <p className="text-small whitespace-pre-line text-muted-foreground">
                            <span className="font-semibold text-label">
                              Catatan revisi:{" "}
                            </span>
                            {latest.revisionNote}
                          </p>
                        )}
                      </div>
                    )}

                    {latest.grade && (
                      <div className="flex flex-col gap-3 border-t border-border pt-5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-h3 text-foreground">
                            Rincian skor rubrik
                          </h4>
                          <span className="text-h2 text-primary-600">
                            {formatScore(latest.grade.score)} / 100
                          </span>
                        </div>
                        <ul className="flex flex-col divide-y divide-border text-small">
                          {[...latest.grade.scores]
                            .sort(
                              (a, b) => a.criterion.order - b.criterion.order,
                            )
                            .map((s) => (
                              <li
                                key={s.criterionId}
                                className="flex justify-between gap-3 py-2"
                              >
                                <span className="text-label">
                                  {s.criterion.name}
                                </span>
                                <span className="text-small-strong text-foreground">
                                  {s.score} / 5
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {latest.grade?.feedback && (
                      <div
                        id="umpan-balik"
                        className="flex flex-col gap-3.5 border-t border-border pt-5"
                      >
                        <h4 className="text-h2 text-foreground">
                          Umpan balik guru · milestone ini
                        </h4>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            {latest.grade.grader?.avatarFileId && (
                              <AvatarImage
                                src={`/api/files/${latest.grade.grader.avatarFileId}`}
                                alt={
                                  latest.grade.grader.name ?? event.creator.name
                                }
                              />
                            )}
                            <AvatarFallback>
                              {initialsOf(
                                latest.grade.grader?.name ?? event.creator.name,
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-small-strong text-label">
                              {latest.grade.grader?.name ?? event.creator.name}
                            </span>
                            <span className="text-caption text-muted-foreground">
                              {formatDate(latest.grade.gradedAt)} · Versi{" "}
                              {latest.version}
                            </span>
                          </div>
                        </div>
                        <blockquote className="rounded-xl bg-background p-4 text-body whitespace-pre-line text-label">
                          {latest.grade.feedback}
                        </blockquote>
                      </div>
                    )}

                    <details open className="group border-t border-border pt-5">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-body-strong text-label">
                        <HistoryIcon
                          aria-hidden="true"
                          className="size-4 text-muted-foreground"
                        />
                        <span className="flex-1">
                          Riwayat pengumpulan ({current.submissions.length}{" "}
                          versi)
                        </span>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <ul className="mt-3 flex flex-col gap-2.5">
                        {current.submissions.map((sub, idx) => {
                          const subFiles = filesOfSubmission(sub);
                          return (
                            <li
                              key={sub.id}
                              className="flex flex-col gap-2 rounded-lg bg-background p-3.5 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-small-strong text-label">
                                  Versi {sub.version}
                                  {idx === 0 ? " · Versi terbaru" : ""}
                                </span>
                                <span className="text-caption text-muted-foreground">
                                  {formatDateTime(sub.submittedAt)} WIB
                                  {subFiles.length > 1
                                    ? ` · ${subFiles.length} berkas`
                                    : ""}
                                  {sub.grade
                                    ? ` · Nilai ${formatScore(sub.grade.score)}`
                                    : sub.status === "REVISION_REQUESTED"
                                      ? " · Revisi diminta"
                                      : " · Menunggu pemeriksaan"}
                                </span>
                              </div>
                              {subFiles.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {subFiles.map((file, fIdx) => (
                                    <a
                                      key={file.id}
                                      href={`/api/files/${file.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={buttonVariants({
                                        variant: "secondary",
                                        size: "sm",
                                        className: "w-fit shrink-0",
                                      })}
                                    >
                                      {subFiles.length > 1
                                        ? `Berkas ${fIdx + 1}`
                                        : "Buka"}
                                      <ExternalLinkIcon aria-hidden="true" />
                                    </a>
                                  ))}
                                </div>
                              ) : sub.link ? (
                                <WebLink
                                  href={sub.link}
                                  className={buttonVariants({
                                    variant: "secondary",
                                    size: "sm",
                                    className: "w-fit shrink-0",
                                  })}
                                >
                                  Buka
                                  <ExternalLinkIcon aria-hidden="true" />
                                </WebLink>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  </>
                )}
              </section>
            </div>

            <aside className="flex flex-col gap-4">
              {allGraded && eventFinal !== null ? (
                <section
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl p-5 text-inverse",
                    belowKkm ? "bg-danger-700" : "bg-primary-500",
                  )}
                >
                  <p className="text-overline text-primary-100 uppercase">
                    Nilai akhir acara
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-hero">{formatScore(eventFinal)}</span>
                    <span className="text-body text-primary-100">/ 100</span>
                  </div>
                  <p className="text-small text-primary-100">
                    Rata-rata nilai {totalMilestones} milestone · semua
                    milestone sudah dinilai
                  </p>
                  <Badge
                    tone={belowKkm ? "danger" : "success"}
                    className="w-fit"
                  >
                    {belowKkm ? "Di bawah KKM" : "KKM Lulus"}
                  </Badge>
                  {scoreFormula && (
                    <p className="text-small text-inverse">
                      {scoreFormula}
                      {belowKkm ? ` · KKM ${event.kkm}` : ""}
                    </p>
                  )}
                </section>
              ) : (
                <section className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5">
                  <p className="text-overline text-muted-foreground uppercase">
                    Nilai akhir acara
                  </p>
                  <p className="text-hero text-subtle">—</p>
                  <p className="text-small text-muted-foreground">
                    {gradedCount} dari {totalMilestones} milestone dinilai.
                    Nilai akhir tampil setelah seluruh milestone dinilai.
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
                      "Perbaiki sesuai arahan guru dan kirim versi baru sebelum batas revisi.",
                  },
                  {
                    title: "Nilai akhir & KKM",
                    description:
                      "Tampil setelah semua milestone dinilai. Sertifikat terbit jika nilai akhir memenuhi KKM.",
                  },
                ]}
              />

              {certificate ? (
                <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2.5">
                    <AwardIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 text-primary-500"
                    />
                    <h3 className="text-h2 text-foreground">
                      Sertifikat tersedia
                    </h3>
                  </div>
                  <p className="text-small text-muted-foreground">
                    Terbit otomatis · {formatDate(certificate.issuedAt)}
                  </p>
                  <ul className="flex flex-col gap-2.5 border-t border-border pt-3 text-small text-label">
                    <li className="flex items-center gap-2">
                      <CircleCheckIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-success-500"
                      />
                      Seluruh tugas dan survei selesai
                    </li>
                    <li className="flex items-center gap-2">
                      <CircleCheckIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-success-500"
                      />
                      Nilai {totalMilestones} dari {totalMilestones} milestone
                      tersedia
                    </li>
                    <li className="flex items-center gap-2">
                      <CircleCheckIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-success-500"
                      />
                      Nilai akhir {formatScore(certificate.finalScore)} ≥ KKM{" "}
                      {event.kkm}
                    </li>
                  </ul>
                  <div className="flex flex-col gap-2.5">
                    <Link
                      href={`/sertifikat/${encodeURIComponent(certificate.number)}/terbit`}
                      className={buttonVariants({
                        size: "lg",
                        className: "w-full",
                      })}
                    >
                      Lihat sertifikat
                      <AwardIcon aria-hidden="true" />
                    </Link>
                    <a
                      href={`/api/sertifikat/${encodeURIComponent(certificate.number)}/pdf`}
                      className={buttonVariants({
                        variant: "secondary",
                        size: "lg",
                        className: "w-full",
                      })}
                    >
                      Unduh PDF
                      <DownloadIcon aria-hidden="true" />
                    </a>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    Sertifikat tersimpan di portofolio acara ini.
                  </p>
                </section>
              ) : allGraded && belowKkm && event.certificateEnabled ? (
                <section className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-card p-5">
                  <IconBox icon={CircleXIcon} tone="danger" size="md" />
                  <h3 className="text-h3 text-foreground">
                    Sertifikat tidak terbit
                  </h3>
                  <p className="text-small text-muted-foreground">
                    Sertifikat hanya terbit jika nilai akhir mencapai KKM (
                    {event.kkm}). Nilai sudah final dan tidak dapat diubah.
                  </p>
                  {latest?.grade?.feedback && (
                    <a
                      href="#umpan-balik"
                      className={buttonVariants({
                        variant: "secondary",
                        className: "w-full",
                      })}
                    >
                      Lihat umpan balik guru
                    </a>
                  )}
                  <Link
                    href="/jelajah"
                    className={buttonVariants({ className: "w-full" })}
                  >
                    Jelajah acara lain
                  </Link>
                </section>
              ) : (
                event.certificateEnabled && (
                  <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
                    <h3 className="text-h3 text-foreground">
                      Sertifikat belum tersedia
                    </h3>
                    <p className="text-small text-muted-foreground">
                      Sertifikat terbit otomatis setelah seluruh milestone
                      dinilai dan nilai akhir minimal {event.kkm}.
                    </p>
                  </section>
                )
              )}

              <div className="flex items-start gap-2.5 rounded-xl bg-primary-50 p-4 text-small text-muted-foreground">
                <InfoIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary-500"
                />
                <p>
                  Bukti pekerjaan, umpan balik, dan versi pengumpulan tetap
                  tersimpan sebagai riwayat proses belajar Anda.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
