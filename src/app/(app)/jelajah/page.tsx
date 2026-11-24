import { CompassIcon } from "lucide-react";
import type { Metadata } from "next";

import {
  hrefWith,
  pageOf,
  param,
  type SearchParams,
} from "@/app/(app)/_components/href";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { ExploreCard } from "@/app/(app)/jelajah/_components/explore-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { phaseWhere, visibleEventWhere } from "@/lib/event-query";
import { eventPhase } from "@/lib/event-rules";
import { logoUrlOf } from "@/lib/organization-access";
import { requireParticipant } from "@/lib/participant-access";

export const metadata: Metadata = { title: "Jelajah" };

const PATH = "/jelajah";
const PAGE_SIZE = 6;
const STATUS_OPTIONS = [
  { value: "semua", label: "Semua status" },
  { value: "berlangsung", label: "Berlangsung" },
  { value: "belum", label: "Segera dimulai" },
  { value: "berakhir", label: "Selesai" },
];

export default async function JelajahPage({
  searchParams,
}: PageProps<"/jelajah">) {
  const user = await requireParticipant();
  const params = (await searchParams) as SearchParams;
  const tab = param(params, "tab") === "diikuti" ? "diikuti" : "acara";
  const q = param(params, "q");
  const orgId = param(params, "org");
  const fieldId = param(params, "bidang");
  const status = param(params, "status");
  const page = pageOf(params);
  const now = new Date();

  const joined: Prisma.EventWhereInput = {
    enrollments: { some: { userId: user.id } },
  };
  const filters: Prisma.EventWhereInput = {
    ...visibleEventWhere,
    ...(orgId ? { organizationId: orgId } : {}),
    ...(fieldId ? { fieldId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { field: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const where: Prisma.EventWhereInput = {
    AND: [filters, phaseWhere(status, now), tab === "diikuti" ? joined : {}],
  };

  const [total, totalAll, joinedAll, events, organizations, fields] =
    await Promise.all([
      db.event.count({ where }),
      db.event.count({ where: visibleEventWhere }),
      db.event.count({ where: { AND: [visibleEventWhere, joined] } }),
      db.event.findMany({
        where,
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          field: { select: { name: true } },
          creator: { select: { name: true } },
          organization: {
            select: {
              name: true,
              type: true,
              logo: { select: { key: true, name: true, contentType: true } },
            },
          },
          enrollments: { where: { userId: user.id }, select: { id: true } },
          _count: { select: { milestones: true } },
        },
      }),
      db.organization.findMany({
        where: { status: "APPROVED", events: { some: visibleEventWhere } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      db.subjectField.findMany({
        where: { events: { some: visibleEventWhere } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  const logos = await Promise.all(
    events.map((e) => logoUrlOf(e.organization.logo)),
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl bg-primary-50 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-overline text-primary-500">
            Jelajahi. Pelajari. Wujudkan.
          </p>
          <h1 className="text-display text-foreground">
            Temukan ruang untuk bertumbuh.
          </h1>
          <p className="text-small text-label">
            Pilih proyek dari organisasi yang terdaftar di Becraft. Bangun
            karya, satu milestone pada satu waktu.
          </p>
        </div>
        <dl className="flex gap-8 border-primary-200 lg:border-l lg:pl-8">
          <div>
            <dt className="text-caption text-muted-foreground">Total acara</dt>
            <dd className="text-display text-primary-600">{totalAll}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">
              Belum diikuti
            </dt>
            <dd className="text-display text-primary-600">
              {totalAll - joinedAll}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="sm:col-span-2 lg:col-span-1">
          <SearchParamInput
            label="Cari acara"
            placeholder="Cari judul acara atau topik…"
          />
        </div>
        <SearchParamSelect
          name="org"
          label="Penyelenggara"
          options={[
            { value: "", label: "Semua penyelenggara" },
            ...organizations.map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <SearchParamSelect
          name="bidang"
          label="Kategori"
          options={[
            { value: "", label: "Semua kategori" },
            ...fields.map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
        <SearchParamSelect
          name="status"
          label="Status"
          options={STATUS_OPTIONS}
        />
      </div>

      <LinkTabs
        label="Jenis daftar"
        active={tab}
        className="px-0 sm:px-0"
        tabs={[
          {
            value: "acara",
            label: "Acara",
            count: totalAll,
            href: hrefWith(PATH, params, { tab: null, page: null }),
          },
          {
            value: "diikuti",
            label: "Diikuti",
            count: joinedAll,
            href: hrefWith(PATH, params, { tab: "diikuti", page: null }),
          },
        ]}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CompassIcon}
          title={
            tab === "diikuti" && !q
              ? "Belum ada acara yang diikuti"
              : "Tidak ada acara yang cocok"
          }
          description={
            tab === "diikuti"
              ? "Ikuti acara dari tab Acara untuk mulai berkarya."
              : "Coba ubah kata kunci atau filter."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {events.map((event, index) => (
            <ExploreCard
              key={event.id}
              event={event}
              phase={eventPhase(event, now)}
              joined={event.enrollments.length > 0}
              logoUrl={logos[index] ?? null}
            />
          ))}
        </div>
      )}
      <ListFooter
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        noun="acara"
        hrefFor={(p) => hrefWith(PATH, params, { page: p })}
      />
    </div>
  );
}
