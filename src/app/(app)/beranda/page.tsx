import {
  ArrowRightIcon,
  AwardIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CompassIcon,
  LayersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { hrefWith, param } from "@/app/(app)/_components/href";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import { requireHomeRole } from "@/app/(app)/home-guard";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { eventPhase, finalScore, type EventPhase } from "@/lib/event-rules";
import { formatDate, formatScore } from "@/lib/format";

export const metadata: Metadata = { title: "Beranda" };

const TABS: { value: string; label: string; phases: EventPhase[] }[] = [
  { value: "semua", label: "Semua", phases: [] },
  { value: "berlangsung", label: "Berlangsung", phases: ["ongoing"] },
  { value: "belum", label: "Belum mulai", phases: ["upcoming"] },
  { value: "selesai", label: "Selesai", phases: ["finished", "archived"] },
];

export default async function BerandaPage({
  searchParams,
}: PageProps<"/beranda">) {
  const user = await requireHomeRole(["PESERTA"]);
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === param(sp, "tab")) ?? TABS[0]!;
  const [enrollments, materialCount] = await Promise.all([
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
            field: { select: { name: true } },
            creator: { select: { name: true } },
            milestones: {
              orderBy: { order: "asc" },
              select: {
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
    db.materialEnrollment.count({ where: { userId: user.id } }),
  ]);
  const items = enrollments.map(({ event, certificate }) => {
    const latest = event.milestones.map((m) => m.submissions[0] ?? null);
    return {
      event,
      certificate,
      phase: eventPhase(event),
      submitted: latest.filter(Boolean).length,
      total: latest.length,
      final: finalScore(latest.map((s) => s?.grade?.score ?? null)),
    };
  });
  const visible = tab.phases.length
    ? items.filter((i) => tab.phases.includes(i.phase))
    : items;
  const submitted = items.reduce((s, i) => s + i.submitted, 0);
  const total = items.reduce((s, i) => s + i.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={`Halo, ${user.name.split(" ")[0]}.`}
          description="Setiap milestone membawa Anda lebih dekat ke karya yang Anda banggakan."
        />
        <Link
          href="/jelajah"
          className={buttonVariants({
            variant: "secondary",
            className: "w-fit",
          })}
        >
          Jelajah acara
          <CompassIcon aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={LayersIcon}
          label="Acara diikuti"
          value={items.length}
        />
        <StatCard
          icon={CheckCircle2Icon}
          label="Tugas milestone dikumpulkan"
          value={`${submitted} / ${total}`}
        />
        <StatCard
          icon={BookOpenIcon}
          label="Materi diikuti"
          value={materialCount}
        />
        <StatCard
          icon={AwardIcon}
          label="Sertifikat tersedia"
          value={items.filter((i) => i.certificate).length}
        />
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-h2 text-foreground">Acara yang Anda ikuti</h2>
        <LinkTabs
          label="Filter acara"
          active={tab.value}
          tabs={TABS.map((t) => ({
            value: t.value,
            label: t.label,
            count: t.phases.length
              ? items.filter((i) => t.phases.includes(i.phase)).length
              : items.length,
            href: hrefWith(
              "/beranda",
              {},
              {
                tab: t.value === "semua" ? null : t.value,
              },
            ),
          }))}
        />
      </div>
      {visible.length === 0 ? (
        <EmptyState
          icon={CompassIcon}
          title="Belum ada acara di sini"
          description="Temukan acara dari organisasi di halaman Jelajah."
          action={
            <Link href="/jelajah" className={buttonVariants()}>
              Jelajah acara
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((i) => (
            <article
              key={i.event.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex flex-col gap-2 bg-primary-50 p-5">
                <span className="text-caption-strong text-primary-600 uppercase">
                  {i.event.field?.name ?? "Umum"}
                </span>
                <h3 className="text-h2 text-foreground">{i.event.title}</h3>
                <span className="text-small text-label">
                  {i.event.creator?.name}
                  {i.event.startsAt && i.event.endsAt
                    ? ` · ${formatDate(i.event.startsAt)} – ${formatDate(i.event.endsAt)}`
                    : ""}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <PhaseBadge phase={i.phase} />
                  <span className="text-small-strong text-primary-600">
                    {i.total === 0
                      ? 0
                      : Math.round((i.submitted / i.total) * 100)}
                    %
                  </span>
                </div>
                <Progress
                  value={i.total === 0 ? 0 : (i.submitted / i.total) * 100}
                />
                <span className="text-caption text-muted-foreground">
                  {i.submitted} dari {i.total} tugas milestone dikumpulkan
                  {i.final !== null && ` · Nilai akhir ${formatScore(i.final)}`}
                  {i.certificate && " · Sertifikat tersedia"}
                </span>
                <Link
                  href={`/acara/${i.event.id}`}
                  className={buttonVariants({ className: "mt-auto" })}
                >
                  {i.phase === "ongoing"
                    ? "Buka ruang kerja"
                    : "Lihat ringkasan"}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <Link
        href="/portofolio"
        className={buttonVariants({ variant: "link", className: "w-fit px-0" })}
      >
        Buka portofolio
        <ArrowRightIcon aria-hidden="true" />
      </Link>
    </div>
  );
}
