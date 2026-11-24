import { ArrowRightIcon, ImagesIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { hrefWith, pageOf, param } from "@/app/(app)/_components/href";
import { SearchParamInput } from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { eventPhase } from "@/lib/event-rules";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Galeri karya" };

const PATH = "/ruang-kerja/galeri";
const PAGE_SIZE = 9;

export default async function GalleryPage({
  searchParams,
}: PageProps<"/ruang-kerja/galeri">) {
  const user = await requirePermission("assessment:manage");
  const organizationId = user.membership!.organization.id;
  const sp = await searchParams;
  const q = param(sp, "q").trim();
  const events = await db.event.findMany({
    where: {
      organizationId,
      status: { not: "DRAFT" },
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      endsAt: true,
      field: { select: { name: true } },
      milestones: { select: { id: true } },
      enrollments: {
        select: {
          userId: true,
          user: {
            select: {
              submissions: {
                distinct: ["milestoneId"],
                select: { milestone: { select: { eventId: true } } },
              },
            },
          },
        },
      },
    },
  });
  const page = pageOf(sp);
  const visible = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Karya peserta"
          description="Jelajahi arsip pekerjaan peserta berdasarkan acara yang diikuti."
        />
        <Badge tone="neutral" className="w-fit">
          <LockIcon aria-hidden="true" />
          Hanya baca
        </Badge>
      </div>
      <section className="flex flex-col gap-1 rounded-2xl bg-primary-50 p-5">
        <h2 className="text-h3 text-foreground">
          Satu acara, satu arsip karya
        </h2>
        <p className="text-small text-label">
          Lihat hasil, umpan balik, dan riwayat versi. Untuk memberi atau
          mengubah nilai, buka Pantau Progres.
        </p>
      </section>
      <SearchParamInput label="Cari acara" placeholder="Cari nama acara…" />
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-foreground">Arsip berdasarkan acara</h2>
        <span className="text-small text-muted-foreground">
          {events.length} acara
        </span>
      </div>
      {visible.length === 0 ? (
        <EmptyState
          icon={ImagesIcon}
          title="Belum ada karya"
          description="Karya peserta tampil setelah acara terbit dan peserta mengumpulkan tugas."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((e) => {
            const total = e.milestones.length;
            const done = e.enrollments.filter(
              (en) =>
                total > 0 &&
                en.user.submissions.filter((s) => s.milestone.eventId === e.id)
                  .length >= total,
            ).length;
            const people = e.enrollments.length;
            return (
              <article
                key={e.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="bg-primary-50 px-5 py-6">
                  <span className="text-caption-strong text-primary-600 uppercase">
                    {e.field?.name ?? "Umum"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <PhaseBadge phase={eventPhase(e)} />
                  <h3 className="text-h3 text-foreground">{e.title}</h3>
                  <span className="text-small text-muted-foreground">
                    {e.startsAt && e.endsAt
                      ? `${formatDate(e.startsAt)} – ${formatDate(e.endsAt)} · `
                      : ""}
                    {people} peserta
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-caption text-muted-foreground">
                      Penyelesaian milestone
                    </span>
                    <span className="text-small-strong text-foreground">
                      {done} dari {people} peserta
                    </span>
                    <Progress
                      value={people === 0 ? 0 : (done / people) * 100}
                    />
                    <span className="text-caption text-muted-foreground">
                      {people - done} peserta belum selesai
                    </span>
                  </div>
                  <Link
                    href={`${PATH}/${e.id}`}
                    className={buttonVariants({ className: "mt-auto" })}
                  >
                    Lihat karya
                    <ArrowRightIcon aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ListFooter
        page={page}
        pageSize={PAGE_SIZE}
        total={events.length}
        noun="acara"
        hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
      />
    </div>
  );
}
