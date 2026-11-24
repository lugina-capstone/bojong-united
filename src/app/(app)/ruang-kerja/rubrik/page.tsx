import {
  CalendarIcon,
  ClipboardListIcon,
  EyeIcon,
  InfoIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  hrefWith,
  PAGE_SIZE,
  pageOf,
  param,
  type SearchParams,
} from "@/app/(app)/_components/href";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import { SearchParamInput } from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { CopyRubricButton } from "@/app/(app)/ruang-kerja/rubrik/_components/copy-rubric-button";
import { rubricFields } from "@/app/(app)/ruang-kerja/rubrik/_components/load-rubric";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
import { formatDate } from "@/lib/format";
import { requireTeacher } from "@/lib/teacher-access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kelola rubrik" };

const PATH = "/ruang-kerja/rubrik";
const used: Prisma.RubricWhereInput = {
  criteria: { some: { scores: { some: {} } } },
};
const TABS = [
  { value: "semua", label: "Semua", where: {} },
  { value: "terkunci", label: "Terkunci", where: used },
  { value: "dapat-diedit", label: "Dapat diedit", where: { NOT: used } },
] as const;

export default async function RubricsPage({
  searchParams,
}: PageProps<"/ruang-kerja/rubrik">) {
  const { organizationId } = await requireTeacher();
  const params = (await searchParams) as SearchParams;
  const tab = TABS.find((t) => t.value === param(params, "tab")) ?? TABS[0];
  const q = param(params, "q");
  const fieldId = param(params, "bidang");
  const page = pageOf(params);

  const base: Prisma.RubricWhereInput = {
    organizationId,
    archivedAt: null,
    ...(fieldId ? { fieldId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            {
              criteria: {
                some: { name: { contains: q, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };
  const where = { AND: [base, tab.where] };
  const all = { organizationId, archivedAt: null };

  const [fields, counts, rubrics, total, lockedTotal, usedEvents] =
    await Promise.all([
      rubricFields(organizationId),
      Promise.all(
        TABS.map((t) => db.rubric.count({ where: { AND: [base, t.where] } })),
      ),
      db.rubric.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          field: { select: { name: true } },
          _count: { select: { criteria: true } },
          criteria: {
            where: { scores: { some: {} } },
            select: { id: true },
            take: 1,
          },
          milestones: { select: { eventId: true } },
        },
      }),
      db.rubric.count({ where }),
      db.rubric.count({ where: { AND: [all, used] } }),
      db.milestone.findMany({
        where: { rubric: all },
        select: { eventId: true },
        distinct: ["eventId"],
      }),
    ]);
  const totalAll = await db.rubric.count({ where: all });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pustaka"
        title="Kelola rubrik"
        description="Rubrik berisi kriteria dengan skala skor 1–5 tanpa bobot. Nilai otomatis dikonversi ke rentang 0–100."
        actions={
          <Link href="/ruang-kerja/rubrik/baru" className={buttonVariants()}>
            <PlusIcon aria-hidden="true" />
            Buat rubrik
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={ClipboardListIcon}
          label="Total rubrik"
          value={totalAll}
          delta={`${lockedTotal} terkunci · ${totalAll - lockedTotal} dapat diedit`}
        />
        <StatCard
          icon={SlidersHorizontalIcon}
          label="Skala standar"
          value="1–5"
          delta="Setara tanpa bobot · konversi 0–100"
        />
        <StatCard
          icon={CalendarIcon}
          label="Dipakai di acara"
          value={`${usedEvents.length} acara`}
          delta="Digunakan lintas milestone penilaian"
        />
      </div>
      <SectionCard
        title="Daftar rubrik penilaian"
        description="Lihat detail skala 1–5, edit rubrik yang belum dipakai menilai, atau buat salinan baru."
      >
        <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5">
          <SearchParamInput
            label="Cari rubrik"
            placeholder="Cari nama rubrik atau kriteria…"
          />
          <nav
            aria-label="Filter bidang"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-small-medium text-label">Bidang:</span>
            {[{ id: "", name: "Semua" }, ...fields].map((field) => (
              <Link
                key={field.id || "semua"}
                href={hrefWith(PATH, params, { bidang: field.id, page: null })}
                scroll={false}
                aria-current={fieldId === field.id ? "page" : undefined}
                className={cn(
                  "rounded-full border border-border px-3.5 py-1.5 text-small-medium text-label transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring",
                  fieldId === field.id &&
                    "border-primary-300 bg-primary-50 text-primary-600",
                )}
              >
                {field.name}
              </Link>
            ))}
          </nav>
        </div>
        <LinkTabs
          label="Status rubrik"
          active={tab.value}
          tabs={TABS.map((t, i) => ({
            value: t.value,
            label: t.label,
            count: counts[i],
            href: hrefWith(PATH, params, {
              tab: t.value === "semua" ? null : t.value,
              page: null,
            }),
          }))}
        />
        {rubrics.length === 0 ? (
          <EmptyState
            icon={ClipboardListIcon}
            title={
              q || fieldId ? "Tidak ada rubrik yang cocok" : "Belum ada rubrik"
            }
            description="Buat rubrik untuk menilai milestone acara."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama rubrik</TableHead>
                <TableHead>Kriteria</TableHead>
                <TableHead>Dipakai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rubrics.map((rubric) => {
                const locked = rubric.criteria.length > 0;
                const events = new Set(rubric.milestones.map((m) => m.eventId))
                  .size;
                return (
                  <TableRow key={rubric.id}>
                    <TableCell>
                      <div className="flex min-w-60 flex-col items-start gap-1">
                        <span className="text-body-strong text-foreground">
                          {rubric.title}
                          {rubric.version > 1 && (
                            <span className="ml-1.5 text-caption text-subtle">
                              v{rubric.version}
                            </span>
                          )}
                        </span>
                        <Badge tone="neutral">{rubric.field.name}</Badge>
                        {rubric.description && (
                          <span className="line-clamp-1 text-caption text-muted-foreground">
                            {rubric.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-24 flex-col">
                        <span className="text-small-strong">
                          {rubric._count.criteria} kriteria
                        </span>
                        <span className="text-caption text-muted-foreground">
                          Maks. {rubric._count.criteria * 5} poin
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-24 flex-col">
                        <span className="text-small-strong">
                          {events} acara
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {locked ? "Aktif menilai" : "Belum menilai"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {locked ? (
                        <Badge tone="warning">
                          <LockIcon aria-hidden="true" />
                          Terkunci
                        </Badge>
                      ) : (
                        <Badge tone="success">
                          <PencilIcon aria-hidden="true" />
                          Dapat diedit
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(rubric.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/ruang-kerja/rubrik/${rubric.id}`}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "sm",
                          })}
                        >
                          <EyeIcon aria-hidden="true" />
                          Lihat
                        </Link>
                        {locked ? (
                          <CopyRubricButton rubricId={rubric.id} />
                        ) : (
                          <Link
                            href={`/ruang-kerja/rubrik/${rubric.id}/edit`}
                            className={buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            })}
                          >
                            <PencilIcon aria-hidden="true" />
                            Edit
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <div className="border-t border-border px-4 py-4 sm:px-5">
          <ListFooter
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            noun="rubrik"
            hrefFor={(p) => hrefWith(PATH, params, { page: p })}
          />
        </div>
      </SectionCard>
      <p className="flex items-start gap-2 text-small text-muted-foreground">
        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Rubrik yang sudah dipakai menilai peserta otomatis terkunci agar riwayat
        nilai tetap konsisten. Gunakan Salin untuk membuat versi baru yang dapat
        diedit.
      </p>
    </div>
  );
}
