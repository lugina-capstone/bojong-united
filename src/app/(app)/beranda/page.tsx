import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CircleCheckIcon,
  ClockIcon,
  CompassIcon,
  LayersIcon,
  LayoutTemplateIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { hrefWith, pageOf, param } from "@/app/(app)/_components/href";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { requireHomeRole } from "@/app/(app)/home-guard";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBox } from "@/components/ui/icon-box";
import { MaterialCard } from "@/components/ui/material-card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { COVER_CLASS, coverToneFor } from "@/lib/event-cover";
import { visibleEventWhere } from "@/lib/event-query";
import { eventPhase, finalScore, type EventPhase } from "@/lib/event-rules";
import { formatDate, formatDateTime, formatScore } from "@/lib/format";
import { visibleMaterialWhere } from "@/lib/material-access";
import { materialCardsFor } from "@/lib/material-catalog";
import { formatDuration, materialLevelLabels } from "@/lib/material-rules";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Beranda" };

const PATH = "/beranda";
const PAGE_SIZE = 3;

const TABS: { value: string; label: string; phases: EventPhase[] }[] = [
  { value: "semua", label: "Semua", phases: [] },
  { value: "berlangsung", label: "Berlangsung", phases: ["ongoing"] },
  { value: "belum", label: "Belum mulai", phases: ["upcoming"] },
  { value: "selesai", label: "Selesai", phases: ["finished", "archived"] },
];

const ONBOARDING_STEPS = [
  {
    title: "1. Jelajah & ikuti acara",
    description:
      "Lihat rincian milestone dan rubrik terlebih dahulu sebelum mendaftar.",
  },
  {
    title: "2. Kumpulkan karya & survei",
    description:
      "Unggah karya tiap milestone lalu isi survei untuk membuka milestone berikutnya.",
  },
  {
    title: "3. Raih sertifikat otomatis",
    description:
      "Sertifikat terbit otomatis begitu semua milestone dinilai memenuhi syarat.",
  },
] as const;

export default async function BerandaPage({
  searchParams,
}: PageProps<"/beranda">) {
  const user = await requireHomeRole(["PESERTA"]);
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === param(sp, "tab")) ?? TABS[0]!;
  const page = pageOf(sp);

  const [
    enrollments,
    materialStats,
    learningCards,
    recommendedEvent,
    recommendedMaterial,
  ] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id, event: { status: { not: "DRAFT" } } },
      orderBy: { event: { startsAt: "desc" } },
      select: {
        certificate: { select: { number: true } },
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            startsAt: true,
            endsAt: true,
            kkm: true,
            certificateEnabled: true,
            field: { select: { name: true } },
            creator: { select: { name: true } },
            milestones: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                order: true,
                title: true,
                dueAt: true,
                submissions: {
                  where: { userId: user.id },
                  orderBy: { version: "desc" },
                  take: 1,
                  select: { grade: { select: { score: true } } },
                },
              },
            },
          },
        },
      },
    }),
    db.materialEnrollment.findMany({
      where: { userId: user.id },
      select: { completedAt: true },
    }),
    materialCardsFor(
      user.id,
      {
        status: { not: "DRAFT" },
        enrollments: { some: { userId: user.id } },
      },
      { skip: 0, take: 3 },
    ),
    db.event.findFirst({
      where: {
        ...visibleEventWhere,
        enrollments: { none: { userId: user.id } },
      },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
        creator: { select: { name: true } },
        _count: { select: { milestones: true } },
      },
    }),
    db.material.findFirst({
      where: {
        ...visibleMaterialWhere,
        visibility: "PUBLIC",
        enrollments: { none: { userId: user.id } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        trainer: { select: { name: true } },
        sections: { select: { durationMinutes: true } },
      },
    }),
  ]);

  const items = enrollments.map(({ event, certificate }) => {
    const latest = event.milestones.map((m) => m.submissions[0] ?? null);
    const submittedFlags = latest.map(Boolean);
    const nextIdx = submittedFlags.findIndex((done) => !done);
    const activeMilestone =
      event.milestones[
        nextIdx === -1 ? Math.max(0, event.milestones.length - 1) : nextIdx
      ] ?? null;
    return {
      event,
      certificate,
      phase: eventPhase(event),
      submittedFlags,
      submitted: submittedFlags.filter(Boolean).length,
      graded: latest.filter((s) => s?.grade).length,
      total: latest.length,
      activeMilestone,
      final: finalScore(latest.map((s) => s?.grade?.score ?? null)),
    };
  });

  const isEmpty = items.length === 0;
  const ongoingCount = items.filter((i) => i.phase === "ongoing").length;
  const upcomingCount = items.filter((i) => i.phase === "upcoming").length;
  const finishedCount = items.filter(
    (i) => i.phase === "finished" || i.phase === "archived",
  ).length;
  const submitted = items.reduce((s, i) => s + i.submitted, 0);
  const total = items.reduce((s, i) => s + i.total, 0);
  const certificateCount = items.filter((i) => i.certificate).length;
  const materialCount = materialStats.length;
  const materialDoneCount = materialStats.filter((m) => m.completedAt).length;
  const materialActiveCount = materialCount - materialDoneCount;

  const visible = tab.phases.length
    ? items.filter((i) => tab.phases.includes(i.phase))
    : items;
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const featured =
    page === 1 && (tab.value === "semua" || tab.value === "berlangsung")
      ? (paged.find((i) => i.phase === "ongoing") ?? null)
      : null;
  const gridItems = featured
    ? paged.filter((i) => i.event.id !== featured.event.id)
    : paged;

  const firstName = user.name.split(" ")[0] ?? user.name;
  const recommendedPhaseLabel = recommendedEvent
    ? eventPhase(recommendedEvent) === "ongoing"
      ? "Berlangsung"
      : eventPhase(recommendedEvent) === "upcoming"
        ? "Segera dimulai"
        : "Selesai"
    : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-overline text-subtle uppercase">
            Ruang belajar Anda
          </p>
          <h1 className="text-hero text-foreground">Halo, {firstName}.</h1>
          <p className="text-body text-muted-foreground">
            {isEmpty
              ? "Jelajahi acara tersedia untuk mulai mengerjakan milestone proyek dan mengumpulkan karya."
              : "Setiap milestone membawa Anda lebih dekat ke karya yang Anda banggakan."}
          </p>
        </div>
        <Link
          href="/jelajah"
          className={buttonVariants({
            variant: isEmpty ? "primary" : "secondary",
            size: "lg",
            className: "w-fit shrink-0",
          })}
        >
          {isEmpty && <CompassIcon aria-hidden="true" />}
          Jelajah acara
          {!isEmpty && <ArrowUpRightIcon aria-hidden="true" />}
        </Link>
      </header>

      <section
        aria-label="Ringkasan perjalanan belajar"
        className="grid grid-cols-1 gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] xl:gap-0 xl:divide-x xl:divide-border"
      >
        {[
          {
            icon: isEmpty ? CalendarDaysIcon : LayersIcon,
            value: items.length,
            label: "Acara diikuti",
            note: isEmpty
              ? "Belum ada acara aktif"
              : `${ongoingCount} aktif · ${upcomingCount} belum mulai · ${finishedCount} selesai`,
          },
          {
            icon: CircleCheckIcon,
            value: `${submitted} / ${total}`,
            label: "Tugas milestone dikumpulkan",
            note: isEmpty
              ? "Mulai dari milestone pertama"
              : "Dari seluruh acara Anda",
          },
          {
            icon: BookOpenIcon,
            value: materialCount,
            label: "Materi diikuti",
            note:
              materialCount === 0
                ? "Belajar mandiri tanpa tugas"
                : `${materialActiveCount} sedang dipelajari · ${materialDoneCount} selesai`,
          },
          {
            icon: AwardIcon,
            value: certificateCount,
            label: "Sertifikat tersedia",
            note: isEmpty
              ? "Tersimpan otomatis di portofolio"
              : "Tersimpan di portofolio",
          },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className={cn(
              "flex items-center gap-3.5",
              idx > 0 && "xl:pl-5",
              idx < 3 && "xl:pr-5",
            )}
          >
            <IconBox icon={stat.icon} tone="primary" size="md" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-stat text-foreground">{stat.value}</p>
              <p className="text-small-strong text-label">{stat.label}</p>
              <p className="text-caption text-muted-foreground">{stat.note}</p>
            </div>
          </div>
        ))}
      </section>

      {isEmpty ? (
        <>
          <section className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-5 py-8 text-center shadow-sm sm:px-10 sm:py-10">
            <IconBox icon={CompassIcon} tone="primary" size="xl" />
            <div className="flex max-w-xl flex-col gap-1.5">
              <h2 className="text-display text-foreground">
                Belum ada acara yang diikuti
              </h2>
              <p className="text-body text-muted-foreground">
                Temukan acara atau materi belajar di Jelajah. Milestone akan
                terbuka otomatis saat jadwal mulai tiba, dan karya selesai
                tersimpan di Portofolio.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-4 text-center md:grid-cols-3">
              {ONBOARDING_STEPS.map((step) => (
                <div
                  key={step.title}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-4"
                >
                  <p className="text-body-strong text-foreground">
                    {step.title}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/jelajah" className={buttonVariants({ size: "lg" })}>
              Jelajah acara sekarang
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </section>

          {(recommendedEvent || recommendedMaterial) && (
            <section
              aria-label="Rekomendasi acara dan materi"
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              {recommendedEvent && (
                <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-3.5">
                  <IconBox icon={LayoutTemplateIcon} tone="blue" size="md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h3 className="truncate text-body-strong text-foreground">
                      {recommendedEvent.title}
                    </h3>
                    <p className="truncate text-caption text-muted-foreground">
                      {recommendedPhaseLabel} ·{" "}
                      {recommendedEvent._count.milestones} milestone · Guru:{" "}
                      {recommendedEvent.creator.name}
                    </p>
                  </div>
                  <Link
                    href={`/jelajah/${recommendedEvent.id}`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: "w-fit shrink-0",
                    })}
                  >
                    Lihat detail
                    <ArrowUpRightIcon aria-hidden="true" />
                  </Link>
                </article>
              )}
              {recommendedMaterial &&
                (() => {
                  const recMinutes = recommendedMaterial.sections.reduce(
                    (s, x) => s + (x.durationMinutes ?? 0),
                    0,
                  );
                  return (
                    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-3.5">
                      <IconBox icon={BookOpenIcon} tone="success" size="md" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <h3 className="truncate text-body-strong text-foreground">
                          {recommendedMaterial.title}
                        </h3>
                        <p className="truncate text-caption text-muted-foreground">
                          Materi · {recommendedMaterial.sections.length} bagian
                          {recMinutes > 0
                            ? ` · ${formatDuration(recMinutes)}`
                            : ""}{" "}
                          · Trainer: {recommendedMaterial.trainer.name}
                        </p>
                      </div>
                      <Link
                        href={`/jelajah/materi/${recommendedMaterial.id}`}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                          className: "w-fit shrink-0",
                        })}
                      >
                        Lihat detail
                        <ArrowUpRightIcon aria-hidden="true" />
                      </Link>
                    </article>
                  );
                })()}
            </section>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-h2 text-foreground">Acara yang Anda ikuti</h2>
            <nav
              aria-label="Filter acara"
              className="inline-flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-muted/60 p-1"
            >
              {TABS.map((t) => {
                const count = t.phases.length
                  ? items.filter((i) => t.phases.includes(i.phase)).length
                  : items.length;
                const active = tab.value === t.value;
                return (
                  <Link
                    key={t.value}
                    href={hrefWith(
                      PATH,
                      {},
                      {
                        tab: t.value === "semua" ? null : t.value,
                      },
                    )}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-small-medium transition-colors",
                      active
                        ? "border-border bg-card font-semibold text-primary-500 shadow-xs"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label} ({count})
                  </Link>
                );
              })}
            </nav>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={CompassIcon}
              title="Belum ada acara di kategori ini"
              description="Coba pilih tab lain atau temukan acara baru di halaman Jelajah."
              action={
                <Link href="/jelajah" className={buttonVariants()}>
                  Jelajah acara
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              {featured && (
                <article className="grid grid-cols-1 gap-6 rounded-2xl bg-primary-100 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
                  <div className="flex flex-col gap-3.5">
                    <p className="text-overline text-primary-500 uppercase">
                      {featured.event.field?.name ?? "Umum"} / Sedang dikerjakan
                    </p>
                    <h3 className="text-display text-tone-navy-fg">
                      {featured.event.title}
                    </h3>
                    <p className="text-small text-muted-foreground">
                      Guru: {featured.event.creator.name}
                      {featured.event.startsAt && featured.event.endsAt
                        ? ` · ${formatDate(featured.event.startsAt)} – ${formatDate(featured.event.endsAt)}`
                        : ""}
                    </p>
                    <Link
                      href={`/acara/${featured.event.id}`}
                      className={buttonVariants({
                        size: "lg",
                        className: "mt-1 w-fit",
                      })}
                    >
                      Buka ruang kerja
                      <ArrowRightIcon aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="flex flex-col gap-3.5 rounded-xl bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-small-strong text-tone-slate-fg">
                        Tugas dikumpulkan
                      </span>
                      <span className="text-h2 text-primary-500">
                        {featured.total === 0
                          ? 0
                          : Math.round(
                              (featured.submitted / featured.total) * 100,
                            )}
                        %
                      </span>
                    </div>
                    {featured.total > 0 && (
                      <div
                        className="flex gap-1.5"
                        aria-label={`${featured.submitted} dari ${featured.total} milestone`}
                      >
                        {featured.submittedFlags.map((done, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-2 flex-1 rounded-full",
                              done ? "bg-success-500" : "bg-muted",
                            )}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-caption text-subtle">
                      {featured.submitted} dari {featured.total} tugas milestone
                      telah dikumpulkan
                    </p>
                    {featured.activeMilestone && (
                      <div className="flex flex-col gap-1 border-t border-border pt-3">
                        <p className="text-overline text-subtle uppercase">
                          Milestone terakhir
                        </p>
                        <p className="text-body-strong text-label">
                          {featured.activeMilestone.order}.{" "}
                          {featured.activeMilestone.title}
                        </p>
                        {featured.activeMilestone.dueAt && (
                          <p className="text-caption text-subtle">
                            Tenggat{" "}
                            {formatDateTime(featured.activeMilestone.dueAt)} WIB
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )}

              {gridItems.length > 0 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {gridItems.map((i) => {
                    const percent =
                      i.total === 0
                        ? 0
                        : Math.round((i.submitted / i.total) * 100);
                    const allSubmitted = i.total > 0 && i.submitted === i.total;
                    const allGraded = i.total > 0 && i.graded === i.total;
                    const belowKkm = i.final !== null && i.final < i.event.kkm;
                    return (
                      <article
                        key={i.event.id}
                        className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                      >
                        <div
                          className={cn(
                            "flex min-h-32 flex-col justify-center gap-2 p-5",
                            COVER_CLASS[coverToneFor(i.event.id)],
                          )}
                        >
                          <span className="text-overline uppercase">
                            {i.event.field?.name ?? "Umum"}
                          </span>
                          <h3 className="line-clamp-2 text-display">
                            {i.event.title}
                          </h3>
                        </div>
                        <div className="flex flex-1 flex-col gap-3.5 p-5">
                          {allSubmitted ? (
                            <div className="flex items-center gap-2 text-small-strong text-success-600">
                              <CircleCheckIcon
                                aria-hidden="true"
                                className="size-4 shrink-0"
                              />
                              <span>Seluruh tugas dikumpulkan</span>
                              <span className="ml-auto text-caption-strong">
                                100%
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <PhaseBadge phase={i.phase} />
                                <span className="text-small-strong text-primary-600">
                                  {percent}%
                                </span>
                              </div>
                              <Progress value={percent} />
                            </div>
                          )}
                          <p className="text-caption text-muted-foreground">
                            {i.submitted} dari {i.total} milestone
                            {i.event.startsAt && i.event.endsAt
                              ? ` · ${formatDate(i.event.startsAt)} – ${formatDate(i.event.endsAt)}`
                              : ""}
                          </p>
                          <div className="flex items-center gap-4 rounded-lg bg-background p-3.5">
                            <div className="flex shrink-0 flex-col gap-0.5">
                              <span className="text-overline text-subtle uppercase">
                                Nilai akhir
                              </span>
                              <span
                                className={cn(
                                  "text-stat",
                                  belowKkm ? "text-danger-600" : "text-label",
                                )}
                              >
                                {i.final === null ? "—" : formatScore(i.final)}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span
                                className={cn(
                                  "text-small-strong",
                                  allGraded
                                    ? belowKkm
                                      ? "text-danger-600"
                                      : "text-success-600"
                                    : "text-label",
                                )}
                              >
                                {allGraded
                                  ? belowKkm
                                    ? "Di bawah KKM"
                                    : "Sudah dinilai"
                                  : `${i.graded} dari ${i.total} nilai milestone tersedia`}
                              </span>
                              <span className="text-caption text-muted-foreground">
                                {allGraded
                                  ? `${i.graded} dari ${i.total} nilai milestone tersedia`
                                  : "Nilai akhir & status KKM tampil setelah semua milestone dinilai."}
                              </span>
                            </div>
                          </div>
                          {i.event.certificateEnabled && (
                            <p className="flex items-center gap-2 text-caption text-muted-foreground">
                              {i.certificate ? (
                                <>
                                  <AwardIcon
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-primary-500"
                                  />
                                  Sertifikat tersedia di portofolio
                                </>
                              ) : belowKkm ? (
                                <>
                                  <ClockIcon
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-danger-500"
                                  />
                                  Sertifikat tidak terbit (KKM {i.event.kkm})
                                </>
                              ) : (
                                <>
                                  <ClockIcon
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-subtle"
                                  />
                                  Sertifikat terbit setelah semua syarat
                                  terpenuhi
                                </>
                              )}
                            </p>
                          )}
                          <Link
                            href={`/acara/${i.event.id}`}
                            className={buttonVariants({
                              variant:
                                i.phase === "ongoing" ? "primary" : "secondary",
                              className: "mt-auto w-full",
                            })}
                          >
                            {i.phase === "ongoing"
                              ? "Buka ruang kerja"
                              : "Lihat ringkasan"}
                            <ArrowUpRightIcon aria-hidden="true" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-caption text-subtle">
                  Hasil karya dan sertifikat tersimpan per acara di portofolio
                  Anda.
                </p>
                <Link
                  href="/portofolio"
                  className="inline-flex w-fit items-center gap-1 text-small-strong text-primary-500 hover:underline"
                >
                  Buka portofolio
                  <ArrowUpRightIcon aria-hidden="true" className="size-4" />
                </Link>
              </div>

              {visible.length > PAGE_SIZE && (
                <div className="rounded-xl border border-border bg-card">
                  <ListFooter
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={visible.length}
                    noun="acara"
                    hrefFor={(p) =>
                      hrefWith(
                        PATH,
                        { tab: tab.value === "semua" ? undefined : tab.value },
                        { page: p },
                      )
                    }
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {(!isEmpty || learningCards.length > 0) && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-h2 text-foreground">Materi yang Anda ikuti</h2>
            <Link
              href="/jelajah?tab=materi"
              className="inline-flex w-fit items-center gap-1 text-small-strong text-primary-500 hover:underline"
            >
              Lihat semua materi
              <ArrowUpRightIcon aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {learningCards.length === 0 ? (
            <EmptyState
              icon={BookOpenIcon}
              title="Belum ada materi yang diikuti"
              description="Belajar mandiri tanpa tugas dan nilai lewat Jelajah › Materi."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {learningCards.map((m) => {
                const done = Boolean(m.enrollment?.completedAt);
                const learningNow = Boolean(m.enrollment) && !done;
                return (
                  <MaterialCard
                    key={m.id}
                    title={m.title}
                    category={m.category}
                    description={m.description}
                    organization={m.organization}
                    trainer={m.trainer}
                    organizationLogo={m.logoUrl}
                    levelLabel={materialLevelLabels[m.level]}
                    sections={m.sections}
                    duration={formatDuration(m.minutes)}
                    learners={m.learners}
                    status={
                      done
                        ? "completed"
                        : learningNow
                          ? "in-progress"
                          : "not-started"
                    }
                    progress={m.enrollment?.progress ?? 0}
                    cover={m.cover}
                    className="sm:max-w-none"
                    action={
                      <Link
                        href={`/materi/${m.id}`}
                        className={buttonVariants({
                          variant: done ? "secondary" : "primary",
                          className: "w-full",
                        })}
                      >
                        {done ? "Buka lagi" : "Lanjutkan belajar"}
                        {done ? (
                          <ArrowUpRightIcon aria-hidden="true" />
                        ) : (
                          <ArrowRightIcon aria-hidden="true" />
                        )}
                      </Link>
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
