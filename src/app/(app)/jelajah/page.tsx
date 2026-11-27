import { ArrowUpRightIcon, CompassIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  hrefWith,
  pageOf,
  pageSizeOf,
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
import { MaterialExplore } from "@/app/(app)/jelajah/_components/material-explore";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBox } from "@/components/ui/icon-box";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { phaseWhere, visibleEventWhere } from "@/lib/event-query";
import { eventPhase } from "@/lib/event-rules";
import { visibleMaterialWhere } from "@/lib/material-access";
import { logoUrlOf } from "@/lib/organization-access";
import { requireParticipant } from "@/lib/participant-access";

export const metadata: Metadata = { title: "Jelajah" };

const PATH = "/jelajah";
const PAGE_SIZES = [4, 6, 12] as const;
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
  if (param(params, "tab") === "materi") {
    return <MaterialExplore userId={user.id} params={params} />;
  }
  const tab = param(params, "tab") === "diikuti" ? "diikuti" : "acara";
  const q = param(params, "q");
  const orgId = param(params, "org");
  const fieldId = param(params, "bidang");
  const status = param(params, "status");
  const page = pageOf(params);
  const pageSize = pageSizeOf(params, PAGE_SIZES, PAGE_SIZE);
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

  const [
    total,
    totalAll,
    joinedAll,
    events,
    organizations,
    fields,
    publicMaterials,
  ] = await Promise.all([
    db.event.count({ where }),
    db.event.count({ where: visibleEventWhere }),
    db.event.count({ where: { AND: [visibleEventWhere, joined] } }),
    db.event.findMany({
      where,
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    db.material.count({
      where: { ...visibleMaterialWhere, visibility: "PUBLIC" },
    }),
  ]);
  const logos = await Promise.all(
    events.map((e) => logoUrlOf(e.organization.logo)),
  );
  const hasFilters = Boolean(q || orgId || fieldId || status);
  const selectedFieldName = fieldId
    ? fields.find((f) => f.id === fieldId)?.name
    : undefined;
  const emptyFilterDescription = (() => {
    const parts: string[] = [];
    if (q) parts.push(`kata kunci “${q}”`);
    if (selectedFieldName) parts.push(`di kategori ${selectedFieldName}`);
    if (parts.length === 0) {
      return "Belum ada acara yang sesuai dengan filter pilihan Anda. Coba ubah atau hapus filter.";
    }
    return `Belum ada acara untuk ${parts.join(" ")}. Coba kata kunci lain, ubah kategori, atau hapus filter.`;
  })();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl bg-primary-50 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-overline text-primary-500 uppercase">
            Jelajahi. Pelajari. Wujudkan.
          </p>
          <h1 className="text-display text-tone-navy-fg">
            Temukan ruang untuk bertumbuh.
          </h1>
          <p className="text-small text-label">
            Pilih proyek dari organisasi yang terdaftar di Becraft. Bangun
            karya, satu milestone pada satu waktu.
          </p>
        </div>
        <div className="flex flex-col gap-3 border-primary-200 lg:border-l lg:pl-8">
          <p className="text-h3 text-tone-navy-fg">
            Belajar lewat proyek nyata
          </p>
          <dl className="flex gap-8">
            <div className="flex flex-col">
              <dd className="text-stat text-primary-500">{totalAll}</dd>
              <dt className="text-caption text-subtle">Total acara</dt>
            </div>
            <div className="flex flex-col">
              <dd className="text-stat text-primary-500">
                {totalAll - joinedAll}
              </dd>
              <dt className="text-caption text-subtle">Belum diikuti</dt>
            </div>
          </dl>
        </div>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LinkTabs
          label="Jenis daftar"
          active={tab}
          className="min-w-0 px-0 sm:px-0"
          tabs={[
            {
              value: "acara",
              label: "Acara",
              count: tab === "acara" && hasFilters ? total : totalAll,
              href: hrefWith(PATH, params, { tab: null, page: null }),
            },
            {
              value: "materi",
              label: "Materi",
              count: publicMaterials,
              href: hrefWith(PATH, {}, { tab: "materi" }),
            },
            {
              value: "diikuti",
              label: "Diikuti",
              count: tab === "diikuti" && hasFilters ? total : joinedAll,
              href: hrefWith(PATH, params, { tab: "diikuti", page: null }),
            },
          ]}
        />
        <Link
          href="/beranda"
          className={buttonVariants({
            variant: "secondary",
            size: "sm",
            className: "w-fit shrink-0",
          })}
        >
          Acara saya ({joinedAll})
          <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      </div>

      {events.length === 0 ? (
        tab === "diikuti" && !hasFilters ? (
          <EmptyState
            icon={CompassIcon}
            title="Belum ada acara yang diikuti"
            description="Ikuti acara dari tab Acara untuk mulai berkarya."
            action={
              <Link href={PATH} className={buttonVariants()}>
                Lihat semua acara
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
            <IconBox icon={SearchXIcon} tone="primary" size="xl" />
            <div className="flex max-w-md flex-col gap-1.5">
              <h2 className="text-h2 text-foreground">
                Tidak ada acara yang cocok
              </h2>
              <p className="text-body text-muted-foreground">
                {emptyFilterDescription}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {hasFilters && (
                <Link
                  href={tab === "diikuti" ? `${PATH}?tab=diikuti` : PATH}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Hapus semua filter
                </Link>
              )}
              <Link href={PATH} className={buttonVariants()}>
                Lihat semua acara
              </Link>
            </div>
          </div>
        )
      ) : (
        <>
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
          <ListFooter
            page={page}
            pageSize={pageSize}
            total={total}
            noun="acara"
            pageSizeControl={
              <SearchParamSelect
                name="per"
                label="Jumlah acara per halaman"
                options={PAGE_SIZES.map((n) => ({
                  value: String(n),
                  label: String(n),
                }))}
                defaultValue={String(PAGE_SIZE)}
              />
            }
            hrefFor={(p) => hrefWith(PATH, params, { page: p })}
          />
        </>
      )}
    </div>
  );
}
