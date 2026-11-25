import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CircleCheckIcon,
  HistoryIcon,
} from "lucide-react";
import Link from "next/link";

import {
  hrefWith,
  PAGE_SIZE,
  pageOf,
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
import { MaterialCard } from "@/components/ui/material-card";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { visibleEventWhere } from "@/lib/event-query";
import { visibleMaterialWhere } from "@/lib/material-access";
import { materialCardsFor } from "@/lib/material-catalog";
import { formatDuration, materialLevelLabels } from "@/lib/material-rules";

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
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl bg-primary-50 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-overline text-primary-500">
            Belajar mandiri. Kapan saja.
          </p>
          <h1 className="text-display text-foreground">
            Perdalam ilmu lewat materi pilihan.
          </h1>
          <p className="text-small text-label">
            Ikuti materi dari sekolah, lembaga, atau perusahaan mana pun — tanpa
            tugas, tenggat, atau nilai.
          </p>
        </div>
        <dl className="flex gap-8 border-primary-200 lg:border-l lg:pl-8">
          <div>
            <dt className="text-caption text-muted-foreground">
              Materi tersedia
            </dt>
            <dd className="text-display text-primary-600">{totalAll}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">
              Sedang diikuti
            </dt>
            <dd className="text-display text-primary-600">{learning}</dd>
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
              count: totalAll,
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
            className: "w-fit",
          })}
        >
          <HistoryIcon aria-hidden="true" />
          Riwayat belajar
        </Link>
      </div>
      {cards.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="Tidak ada materi yang cocok"
          description="Coba ubah kata kunci atau filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((m) => {
            const done = Boolean(m.enrollment?.completedAt);
            const learningNow = Boolean(m.enrollment) && !done;
            return (
              <div key={m.id} className="flex flex-col gap-3 rounded-2xl">
                <MaterialCard
                  title={m.title}
                  category={m.category}
                  description={m.description}
                  organization={`${m.organization} · ${m.trainer}`}
                  organizationLogo={m.logoUrl}
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
                  className="flex-1 sm:max-w-none"
                />
                {done && (
                  <p className="flex items-center gap-1.5 text-caption text-success-700">
                    <CircleCheckIcon aria-hidden="true" className="size-4" />
                    Selesai · tersimpan di Riwayat belajar
                  </p>
                )}
                <Link
                  href={
                    m.enrollment ? `/materi/${m.id}` : `/jelajah/materi/${m.id}`
                  }
                  className={buttonVariants({
                    variant: done ? "secondary" : "primary",
                  })}
                >
                  {done
                    ? "Buka lagi"
                    : learningNow
                      ? "Lanjutkan belajar"
                      : "Lihat detail & ikuti"}
                  <ArrowUpRightIcon aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
      <ListFooter
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        noun="materi"
        hrefFor={(p) => hrefWith(PATH, params, { page: p })}
      />
    </div>
  );
}
