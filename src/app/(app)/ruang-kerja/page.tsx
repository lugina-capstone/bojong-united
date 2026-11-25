import { ArrowUpRightIcon, CalendarPlusIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { eventPhase } from "@/lib/event-rules";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Ruang Kerja" };

export default async function RuangKerjaPage() {
  const user = await requireHomeRole(["GURU", "ASESOR", "TRAINER"]);
  const organizationId = user.membership!.organization.id;
  const events = await db.event.findMany({
    where: { organizationId, creatorId: user.id, status: { not: "DRAFT" } },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      startsAt: true,
      endsAt: true,
      field: { select: { name: true } },
      _count: { select: { enrollments: true, milestones: true } },
      milestones: {
        select: {
          submissions: {
            distinct: ["userId"],
            select: { userId: true },
          },
        },
      },
    },
  });
  const [published, pendingReview, rubrics] = await Promise.all([
    db.event.count({
      where: { organizationId, creatorId: user.id, status: "PUBLISHED" },
    }),
    db.submission.count({
      where: {
        status: "SUBMITTED",
        milestone: { event: { organizationId, creatorId: user.id } },
      },
    }),
    db.rubric.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, _count: { select: { criteria: true } } },
    }),
  ]);
  const cards = events.map((e) => {
    const phase = eventPhase(e);
    const done = e.milestones.reduce((s, m) => s + m.submissions.length, 0);
    const tasks = e._count.enrollments * e._count.milestones;
    return { e, phase, done, tasks };
  });
  const activeParticipants = cards
    .filter((c) => c.phase === "ongoing")
    .reduce((s, c) => s + c.e._count.enrollments, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={`Halo, ${user.name.split(" ")[0]}.`}
          description="Bantu ide peserta berkembang menjadi karya nyata."
        />
        <Link
          href="/ruang-kerja/acara/baru"
          className={buttonVariants({ className: "w-fit" })}
        >
          <PlusIcon aria-hidden="true" />
          Buat acara
        </Link>
      </div>
      <section className="grid grid-cols-1 gap-5 rounded-2xl bg-foreground p-6 text-inverse sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-2">
          <span className="text-overline text-primary-200">
            Belajar. Berkarya. Bertumbuh.
          </span>
          <h2 className="text-h1">Ruang untuk ide besar.</h2>
        </div>
        {[
          { value: published, label: "Acara terbit" },
          { value: activeParticipants, label: "Peserta aktif" },
          { value: pendingReview, label: "Tugas perlu diperiksa" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 border-t border-inverse/20 pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5"
          >
            <span className="text-display">{s.value}</span>
            <span className="text-small">{s.label}</span>
          </div>
        ))}
      </section>
      <h2 className="text-h2 text-foreground">Acara Anda</h2>
      {cards.length === 0 ? (
        <EmptyState
          icon={CalendarPlusIcon}
          title="Belum ada acara terbit"
          description="Buat acara pertama Anda untuk mulai menilai karya peserta."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ e, phase, done, tasks }) => (
            <article
              key={e.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex flex-col gap-2 bg-primary-50 p-5">
                <span className="text-caption-strong text-primary-600 uppercase">
                  {e.field?.name ?? "Umum"}
                </span>
                <h3 className="text-h2 text-foreground">{e.title}</h3>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <PhaseBadge phase={phase} />
                  <span className="text-caption text-muted-foreground">
                    {e._count.enrollments} peserta
                  </span>
                </div>
                {e.startsAt && e.endsAt && (
                  <span className="text-small text-label">
                    {formatDate(e.startsAt)} – {formatDate(e.endsAt)}
                  </span>
                )}
                <div className="flex items-center justify-between text-small">
                  <span className="text-label">Pengumpulan milestone</span>
                  <span className="text-small-strong text-foreground">
                    {tasks === 0 ? 0 : Math.round((done / tasks) * 100)}%
                  </span>
                </div>
                <Progress value={tasks === 0 ? 0 : (done / tasks) * 100} />
                <span className="text-caption text-muted-foreground">
                  {done} dari {tasks} tugas dikumpulkan
                </span>
                <Link
                  href={`/ruang-kerja/tugas/${e.id}`}
                  className={buttonVariants({
                    variant: "link",
                    size: "sm",
                    className: "mt-auto w-fit px-0",
                  })}
                >
                  {phase === "finished" ? "Lihat hasil" : "Lihat progres"}
                  <ArrowUpRightIcon aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {rubrics.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 text-foreground">Rubrik siap pakai</h2>
            <Link
              href="/ruang-kerja/rubrik"
              className="text-small text-primary-600 hover:underline"
            >
              Semua rubrik
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {rubrics.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/ruang-kerja/rubrik/${r.id}`}
                  className="flex justify-between gap-2 py-2 text-small hover:text-primary-600"
                >
                  <span className="text-small-strong">{r.title}</span>
                  <span className="text-muted-foreground">
                    {r._count.criteria} kriteria · Skala 1–5
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
