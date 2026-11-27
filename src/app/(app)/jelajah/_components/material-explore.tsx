import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  SearchXIcon,
} from "lucide-react";
import Link from "next/link";

import {
  hrefWith,
  pageOf,
  pageSizeOf,
  param,
} from "@/app/(app)/_components/href";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBox } from "@/components/ui/icon-box";
import { MaterialCard } from "@/components/ui/material-card";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { visibleEventWhere } from "@/lib/event-query";
import { visibleMaterialWhere } from "@/lib/material-access";
import { materialCardsFor } from "@/lib/material-catalog";
import { formatDuration, materialLevelLabels } from "@/lib/material-rules";

const PAGE_SIZES = [6, 12, 24] as const;
const PAGE_SIZE = 6;

type SearchParams = Record<string, string | string[] | undefined>;

/** Jelajah tab Materi: materi publik dari semua penyelenggara. */
export async function MaterialExplore({
  userId,
  params,
}: {
  userId: string;
  params: SearchParams;
}) {
  const PATH = "/jelajah";
  const q = param(params, "q");
  const categoryId = param(params, "kategori");
  const orgId = param(params, "org");
  const level = param(params, "tingkat");
  const page = pageOf(params);
  const pageSize = pageSizeOf(params, PAGE_SIZES, PAGE_SIZE);
  const publicWhere: Prisma.MaterialWhereInput = {
    ...visibleMaterialWhere,
    visibility: "PUBLIC",
  };
  const where: Prisma.MaterialWhereInput = {
    AND: [
      publicWhere,
      categoryId ? { categoryId } : {},
      orgId ? { organizationId: orgId } : {},
      level === "BEGINNER" || level === "INTERMEDIATE" || level === "ADVANCED"
        ? { level }
        : {},
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { trainer: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {},
    ],
  };
  const [total, totalAll, learning, events, joined, cards, categories, orgs] =
    await Promise.all([
      db.material.count({ where }),
      db.material.count({ where: publicWhere }),
      db.materialEnrollment.count({
        where: { userId, completedAt: null, material: visibleMaterialWhere },
      }),
      db.event.count({ where: visibleEventWhere }),
      db.event.count({
        where: {
          AND: [visibleEventWhere, { enrollments: { some: { userId } } }],
        },
      }),
      materialCardsFor(userId, where, {
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.materialCategory.findMany({
        where: { materials: { some: publicWhere } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      db.organization.findMany({
        where: { status: "APPROVED", materials: { some: publicWhere } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

  const hasFilters = Boolean(q || categoryId || orgId || level);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl border border-primary-100 bg-primary-50 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-overline text-primary-500 uppercase">
            Belajar mandiri. Kapan saja.
          </p>
          <h1 className="text-display text-tone-navy-fg">
            Perdalam ilmu lewat materi pilihan.
          </h1>
          <p className="text-body text-label">
            Ikuti materi dari sekolah, lembaga, atau perusahaan mana pun — tanpa
            tugas, tenggat, atau nilai.
          </p>
        </div>
        <dl className="flex gap-8 border-primary-200 lg:border-l lg:pl-8">
          <div className="flex flex-col">
            <dd className="text-stat text-primary-500">{totalAll}</dd>
            <dt className="text-caption text-muted-foreground">
              Materi tersedia
            </dt>
          </div>
          <div className="flex flex-col">
            <dd className="text-stat text-primary-500">{learning}</dd>
            <dt className="text-caption text-muted-foreground">
              Sedang diikuti
            </dt>
          </div>
        </dl>
      </section>
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="sm:col-span-2 lg:col-span-1">
          <SearchParamInput
            label="Cari materi"
            placeholder="Cari materi, topik, atau trainer…"
          />
        </div>
        <SearchParamSelect
          name="kategori"
          label="Kategori"
          options={[
            { value: "", label: "Semua kategori" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <SearchParamSelect
          name="org"
          label="Penyelenggara"
          options={[
            { value: "", label: "Semua penyelenggara" },
            ...orgs.map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <SearchParamSelect
          name="tingkat"
          label="Tingkat"
          options={[
            { value: "", label: "Semua tingkat" },
            ...Object.entries(materialLevelLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LinkTabs
          label="Jenis daftar"
          active="materi"
          className="px-0 sm:px-0"
          tabs={[
            { value: "acara", label: "Acara", count: events, href: PATH },
            {
              value: "materi",
              label: "Materi",
              count: hasFilters ? total : totalAll,
              href: `${PATH}?tab=materi`,
            },
            {
              value: "diikuti",
              label: "Diikuti",
              count: joined,
              href: `${PATH}?tab=diikuti`,
            },
          ]}
        />
        <Link
          href="/portofolio?tab=belajar"
          className={buttonVariants({
            variant: "secondary",
            size: "sm",
            className: "w-fit shrink-0",
          })}
        >
          Riwayat belajar
          <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      </div>
      {cards.length === 0 ? (
        hasFilters ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
            <IconBox icon={SearchXIcon} tone="primary" size="xl" />
            <div className="flex max-w-md flex-col gap-1.5">
              <h2 className="text-h2 text-foreground">
                Tidak ada materi yang cocok
              </h2>
              <p className="text-body text-muted-foreground">
                Coba ubah kata kunci, tingkat, atau hapus filter untuk melihat
                semua materi.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`${PATH}?tab=materi`}
                className={buttonVariants({ variant: "secondary" })}
              >
                Hapus semua filter
              </Link>
              <Link href={`${PATH}?tab=materi`} className={buttonVariants()}>
                Lihat semua materi
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={BookOpenIcon}
            title="Belum ada materi tersedia"
            description="Materi mandiri yang diterbitkan penyelenggara akan tampil di sini."
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((m) => {
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
                      href={
                        m.enrollment
                          ? `/materi/${m.id}`
                          : `/jelajah/materi/${m.id}`
                      }
                      className={buttonVariants({
                        variant: done ? "secondary" : "primary",
                        className: "w-full",
                      })}
                    >
                      {done
                        ? "Buka lagi"
                        : learningNow
                          ? "Lanjutkan belajar"
                          : "Lihat detail & ikuti"}
                      {learningNow ? (
                        <ArrowRightIcon aria-hidden="true" />
                      ) : (
                        <ArrowUpRightIcon aria-hidden="true" />
                      )}
                    </Link>
                  }
                />
              );
            })}
          </div>
          <ListFooter
            page={page}
            pageSize={pageSize}
            total={total}
            noun="materi"
            pageSizeControl={
              <SearchParamSelect
                name="per"
                label="Jumlah materi per halaman"
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
