import {
  BookOpenIcon,
  CircleCheckIcon,
  FileTextIcon,
  PencilLineIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
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
import { MaterialMenu } from "@/app/(app)/ruang-kerja/materi/_components/material-menu";
import { PublishedToast } from "@/app/(app)/ruang-kerja/materi/_components/published-toast";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { COVER_CLASS } from "@/lib/event-cover";
import { formatDate } from "@/lib/format";
import { requireTrainer } from "@/lib/material-access";
import { formatDuration, materialCover } from "@/lib/material-rules";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Materi pembelajaran" };

const PATH = "/ruang-kerja/materi";
const TABS = [
  { value: "semua", label: "Semua", where: {} },
  { value: "terbit", label: "Terbit", where: { status: "PUBLISHED" } },
  { value: "draf", label: "Draf", where: { status: "DRAFT" } },
  { value: "arsip", label: "Diarsipkan", where: { status: "ARCHIVED" } },
] as const satisfies readonly {
  value: string;
  label: string;
  where: Prisma.MaterialWhereInput;
}[];
const STATUS_BADGE = {
  PUBLISHED: { label: "Terbit", tone: "success" },
  DRAFT: { label: "Draf", tone: "neutral" },
  ARCHIVED: { label: "Diarsipkan", tone: "warning" },
} as const;

export default async function MaterialsPage({
  searchParams,
}: PageProps<"/ruang-kerja/materi">) {
  const { user, organizationId } = await requireTrainer();
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === param(sp, "tab")) ?? TABS[0];
  const q = param(sp, "q").trim();
  const categoryId = param(sp, "kategori");
  const usage = param(sp, "penggunaan");
  const sort = param(sp, "urut");
  const page = pageOf(sp);
  const base: Prisma.MaterialWhereInput = {
    organizationId,
    trainerId: user.id,
  };
  const where: Prisma.MaterialWhereInput = {
    AND: [
      base,
      tab.where,
      q ? { title: { contains: q, mode: "insensitive" } } : {},
      categoryId ? { categoryId } : {},
      usage === "terlampir"
        ? { events: { some: {} } }
        : usage === "mandiri"
          ? { events: { none: {} } }
          : {},
    ],
  };
  const [counts, total, materials, categories, learners, justPublished] =
    await Promise.all([
      Promise.all(
        TABS.map((t) => db.material.count({ where: { AND: [base, t.where] } })),
      ),
      db.material.count({ where }),
      db.material.findMany({
        where,
        orderBy: sort === "judul" ? { title: "asc" } : { updatedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          category: { select: { name: true } },
          sections: { select: { durationMinutes: true } },
          enrollments: { select: { progress: true } },
          _count: { select: { events: true } },
        },
      }),
      db.materialCategory.findMany({
        where: { OR: [{ organizationId }, { organizationId: null }] },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        select: { id: true, name: true },
      }),
      db.materialEnrollment.count({ where: { material: base } }),
      param(sp, "terbit")
        ? db.material.findFirst({
            where: { ...base, id: param(sp, "terbit") },
            select: { title: true },
          })
        : null,
    ]);
  const [all, published, drafts] = counts;

  if (all === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Materi pembelajaran"
          description="Bahan belajar mandiri tanpa milestone, tenggat, tugas, maupun penilaian."
        />
        <section className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-5 py-10 text-center sm:px-10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <BookOpenIcon aria-hidden="true" className="size-7" />
          </span>
          <div className="flex max-w-lg flex-col gap-2">
            <h2 className="text-h1 text-foreground">Belum ada materi</h2>
            <p className="text-small text-muted-foreground">
              Unggah PDF, slide, video, tautan, atau teks bacaan. Peserta enroll
              sendiri lalu belajar dengan ritme masing-masing — materi juga bisa
              dilampirkan ke acara Guru/Asesor.
            </p>
          </div>
          <div className="grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            {[
              [
                "Unggah fleksibel",
                "Berkas maks 10 MB, video, tautan, atau teks bacaan.",
              ],
              [
                "Peserta enroll sendiri",
                "Publik di Jelajah atau khusus lewat acara terlampir.",
              ],
              [
                "Riwayat belajar",
                "Progres tercatat tanpa nilai dan sertifikat.",
              ],
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-border p-4">
                <p className="text-small-strong text-foreground">{title}</p>
                <p className="text-caption text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <Link href={`${PATH}/baru`} className={buttonVariants()}>
            <UploadIcon aria-hidden="true" />
            Unggah materi pertama
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {justPublished && <PublishedToast title={justPublished.title} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Materi pembelajaran"
          description="Kelola materi mandiri dan materi yang dilampirkan ke acara Guru/Asesor."
        />
        <Link
          href={`${PATH}/baru`}
          className={buttonVariants({ className: "w-fit shrink-0" })}
        >
          <UploadIcon aria-hidden="true" />
          Unggah materi
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpenIcon} label="Total materi" value={all} />
        <StatCard icon={CircleCheckIcon} label="Terbit" value={published} />
        <StatCard icon={PencilLineIcon} label="Draf" value={drafts} />
        <StatCard icon={UsersIcon} label="Peserta enroll" value={learners} />
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <SearchParamInput
          label="Cari materi"
          placeholder="Cari judul materi…"
        />
        <SearchParamSelect
          name="kategori"
          label="Kategori"
          options={[
            { value: "", label: "Semua kategori" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <SearchParamSelect
          name="penggunaan"
          label="Penggunaan"
          options={[
            { value: "", label: "Semua penggunaan" },
            { value: "mandiri", label: "Mandiri" },
            { value: "terlampir", label: "Terlampir di acara" },
          ]}
        />
        <SearchParamSelect
          name="urut"
          label="Urutkan"
          options={[
            { value: "", label: "Terbaru diperbarui" },
            { value: "judul", label: "Judul A–Z" },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-caption text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success-500" />≥ 50% selesai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary-500" />
          &lt; 50% selesai
        </span>
      </div>
      <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-4 pt-2 sm:px-5">
          <LinkTabs
            label="Status materi"
            active={tab.value}
            tabs={TABS.map((t, i) => ({
              value: t.value,
              label: t.label,
              count: counts[i],
              href: hrefWith(PATH, sp, {
                tab: t.value === "semua" ? null : t.value,
                page: null,
              }),
            }))}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materi</TableHead>
                <TableHead>Penggunaan</TableHead>
                <TableHead>Peserta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead className="text-center">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-small text-muted-foreground"
                  >
                    Tidak ada materi yang cocok.
                  </TableCell>
                </TableRow>
              )}
              {materials.map((m) => {
                const minutes = m.sections.reduce(
                  (s, x) => s + (x.durationMinutes ?? 0),
                  0,
                );
                const avg =
                  m.enrollments.length === 0
                    ? 0
                    : m.enrollments.reduce((s, e) => s + e.progress, 0) /
                      m.enrollments.length;
                const badge = STATUS_BADGE[m.status];
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex min-w-56 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            COVER_CLASS[materialCover(m.coverColor)],
                          )}
                        >
                          <BookOpenIcon
                            aria-hidden="true"
                            className="size-4.5"
                          />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <Link
                            href={
                              m.status === "DRAFT"
                                ? `${PATH}/${m.id}/edit`
                                : `${PATH}/${m.id}`
                            }
                            className="truncate text-small-strong text-foreground hover:text-primary-600"
                          >
                            {m.title}
                          </Link>
                          <span className="text-caption text-muted-foreground">
                            {m.category.name} · {m.sections.length} bagian
                            {minutes ? ` · ${formatDuration(minutes)}` : ""}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        size="sm"
                        tone={m._count.events ? "primary" : "neutral"}
                      >
                        {m._count.events
                          ? `Terlampir · ${m._count.events} acara`
                          : m.visibility === "PUBLIC"
                            ? "Mandiri"
                            : "Hanya lewat acara"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.enrollments.length === 0 ? (
                        <span className="text-small text-muted-foreground">
                          Belum ada
                        </span>
                      ) : (
                        <div className="flex w-28 flex-col gap-1">
                          <span className="text-small-strong text-foreground">
                            {m.enrollments.length} enroll
                          </span>
                          <Progress
                            value={avg}
                            label={`Rata-rata progres ${m.title}`}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge size="sm" tone={badge.tone}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-small whitespace-nowrap">
                      {formatDate(m.updatedAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={
                            m.status === "DRAFT"
                              ? `${PATH}/${m.id}/edit`
                              : `${PATH}/${m.id}`
                          }
                          className={buttonVariants({
                            size: "sm",
                            variant:
                              m.status === "DRAFT" ? "primary" : "secondary",
                          })}
                        >
                          {m.status === "DRAFT" ? "Lanjutkan" : "Kelola"}
                        </Link>
                        <MaterialMenu
                          id={m.id}
                          title={m.title}
                          status={m.status}
                          learners={m.enrollments.length}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <ListFooter
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            noun="materi"
            hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
          />
        </div>
      </section>
      <p className="flex items-start gap-2 text-caption text-muted-foreground">
        <FileTextIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Materi yang sudah diikuti peserta diarsipkan, bukan dihapus, agar
        riwayat belajar tetap tersimpan.
      </p>
    </div>
  );
}
