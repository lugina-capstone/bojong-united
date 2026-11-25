import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CalendarIcon,
  CalendarPlusIcon,
  ClipboardCheckIcon,
  PlusIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { eventPhase } from "@/lib/event-rules";
import { daysAgo, formatDate, formatRelative, greeting } from "@/lib/format";

const linkClass = "flex items-center gap-1 text-small-strong text-primary-600";

const ACTIVITY_LIMIT = 5;
const activitySelect = {
  id: true,
  createdAt: true,
  completedAt: true,
  user: { select: { name: true } },
  material: { select: { id: true, title: true } },
} as const;

/** Beranda Trainer: acara miliknya seperti Guru, ditambah ringkasan materi belajar mandiri. */
export async function TrainerHome({
  userId,
  firstName,
  organizationId,
  organizationName,
}: {
  userId: string;
  firstName: string;
  organizationId: string;
  organizationName: string;
}) {
  const ownEvent = { organizationId, creatorId: userId };
  const ownMaterial = { organizationId, trainerId: userId };
  const weekAgo = daysAgo(7);
  const [
    events,
    activeEvents,
    pendingReview,
    publishedMaterials,
    draftMaterials,
    learners,
    newLearners,
    popular,
    joins,
    completions,
  ] = await Promise.all([
    db.event.findMany({
      where: { ...ownEvent, status: { not: "DRAFT" } },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
        _count: { select: { enrollments: true, milestones: true } },
        milestones: {
          select: {
            submissions: { distinct: ["userId"], select: { userId: true } },
          },
        },
      },
    }),
    db.event.count({ where: { ...ownEvent, status: "PUBLISHED" } }),
    db.submission.count({
      where: { status: "SUBMITTED", milestone: { event: ownEvent } },
    }),
    db.material.count({ where: { ...ownMaterial, status: "PUBLISHED" } }),
    db.material.count({ where: { ...ownMaterial, status: "DRAFT" } }),
    db.materialEnrollment.count({ where: { material: ownMaterial } }),
    db.materialEnrollment.count({
      where: { material: ownMaterial, createdAt: { gte: weekAgo } },
    }),
    db.material.findMany({
      where: { ...ownMaterial, status: "PUBLISHED" },
      orderBy: [{ enrollments: { _count: "desc" } }, { publishedAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        enrollments: { select: { progress: true } },
      },
    }),
    db.materialEnrollment.findMany({
      where: { material: ownMaterial },
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_LIMIT,
      select: activitySelect,
    }),
    db.materialEnrollment.findMany({
      where: { material: ownMaterial, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: ACTIVITY_LIMIT,
      select: activitySelect,
    }),
  ]);
  // Memakai createdAt dan completedAt, bukan updatedAt: updatedAt ikut berubah saat Trainer mengedit bagian materi.
  const activity = [
    ...joins.map((e) => ({ ...e, done: false, at: e.createdAt })),
    ...completions.map((e) => ({ ...e, done: true, at: e.completedAt! })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, ACTIVITY_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl bg-primary-600 p-5 text-inverse sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-overline text-primary-100">
            Ruang Trainer · {organizationName}
          </p>
          <h1 className="text-display">
            {greeting()}, {firstName}.
          </h1>
          <p className="text-small text-primary-100">
            Buat dan nilai acara seperti Guru/Asesor, lalu bagikan materi
            belajar mandiri tanpa milestone untuk peserta.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/ruang-kerja/materi/baru"
              className={buttonVariants({ variant: "secondary" })}
            >
              <UploadIcon aria-hidden="true" />
              Unggah materi
            </Link>
            <Link
              href="/ruang-kerja/acara/baru"
              className={buttonVariants({ variant: "secondary" })}
            >
              <PlusIcon aria-hidden="true" />
              Buat acara
            </Link>
          </div>
        </div>
        <dl className="flex flex-col gap-2 rounded-xl border border-inverse/30 p-4 lg:min-w-64">
          <dt className="text-overline text-primary-100">Minggu ini</dt>
          <dd className="flex items-baseline gap-2 text-small">
            <span className="text-h2">+{newLearners}</span>
            peserta baru mengikuti materi
          </dd>
          <dd className="flex items-baseline gap-2 text-small">
            <span className="text-h2">{pendingReview}</span>
            karya menunggu dinilai
          </dd>
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarIcon}
          label="Acara aktif"
          value={activeEvents}
        />
        <StatCard
          icon={BookOpenIcon}
          label="Materi terbit"
          value={publishedMaterials}
          delta={draftMaterials ? `${draftMaterials} draf` : undefined}
          tone="neutral"
        />
        <StatCard
          icon={UsersIcon}
          label="Peserta materi"
          value={learners}
          delta={newLearners ? `+${newLearners} minggu ini` : undefined}
          tone="success"
        />
        <StatCard
          icon={ClipboardCheckIcon}
          label="Perlu dinilai"
          value={pendingReview}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <h2 className="text-h3 text-foreground">Acara saya</h2>
              <p className="text-caption text-muted-foreground">
                Dibuat dan dinilai seperti Guru/Asesor
              </p>
            </div>
            <Link href="/ruang-kerja/acara" className={linkClass}>
              Lihat semua
              <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          {events.length === 0 ? (
            <EmptyState
              icon={CalendarPlusIcon}
              title="Belum ada acara terbit"
              description="Buat acara pertama Anda untuk mulai menilai karya peserta."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {events.map((e) => {
                const done = e.milestones.reduce(
                  (s, m) => s + m.submissions.length,
                  0,
                );
                const tasks = e._count.enrollments * e._count.milestones;
                const percent =
                  tasks === 0 ? 0 : Math.round((done / tasks) * 100);
                return (
                  <li
                    key={e.id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Link
                        href={`/ruang-kerja/tugas/${e.id}`}
                        className="truncate text-small-strong text-foreground hover:text-primary-600"
                      >
                        {e.title}
                      </Link>
                      <span className="text-caption text-muted-foreground">
                        {e._count.enrollments} peserta · {e._count.milestones}{" "}
                        milestone
                      </span>
                      <div className="flex items-center gap-2 sm:max-w-72">
                        <Progress
                          value={percent}
                          label={`Pengumpulan ${e.title}`}
                        />
                        <span className="text-caption-strong text-foreground">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 sm:items-end">
                      <PhaseBadge phase={eventPhase(e)} />
                      {e.endsAt && (
                        <span className="text-caption text-muted-foreground">
                          Berakhir {formatDate(e.endsAt)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-h3 text-foreground">Materi terpopuler</h2>
                <p className="text-caption text-muted-foreground">
                  Belajar mandiri, tanpa tugas & nilai
                </p>
              </div>
              <Link href="/ruang-kerja/materi" className={linkClass}>
                Kelola
                <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
            {popular.length === 0 ? (
              <p className="text-small text-muted-foreground">
                Belum ada materi terbit.
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {popular.map((m, index) => {
                  const count = m.enrollments.length;
                  const avg =
                    count === 0
                      ? 0
                      : m.enrollments.reduce((s, x) => s + x.progress, 0) /
                        count;
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-caption-strong text-label">
                        {index + 1}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Link
                          href={`/ruang-kerja/materi/${m.id}`}
                          className="truncate text-small-strong text-foreground hover:text-primary-600"
                        >
                          {m.title}
                        </Link>
                        <Progress
                          value={avg}
                          label={`Rata-rata progres ${m.title}`}
                        />
                      </div>
                      <span className="flex flex-col items-end">
                        <span className="text-body-strong text-foreground">
                          {count}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          peserta
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            <Link
              href="/ruang-kerja/materi/baru"
              className={buttonVariants({ variant: "secondary" })}
            >
              <UploadIcon aria-hidden="true" />
              Unggah materi baru
            </Link>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-h3 text-foreground">Aktivitas terbaru</h2>
            {activity.length === 0 ? (
              <p className="text-small text-muted-foreground">
                Belum ada aktivitas peserta di materi Anda.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {activity.map((a) => (
                  <li
                    key={`${a.id}-${a.done}`}
                    className="flex items-start gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className={
                        a.done
                          ? "mt-1.5 size-2 shrink-0 rounded-full bg-success-500"
                          : "mt-1.5 size-2 shrink-0 rounded-full bg-primary-500"
                      }
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-small text-foreground">
                        {a.user.name}{" "}
                        {a.done ? "menyelesaikan" : "mulai mengikuti"} “
                        {a.material.title}”
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {formatRelative(a.at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
