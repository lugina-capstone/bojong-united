import {
  ArrowUpRightIcon,
  ClipboardCheckIcon,
  InfoIcon,
  LayersIcon,
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
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { SectionCard } from "@/app/(app)/_components/section-card";
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
import { assessableEvents, loadEventResults } from "@/lib/event-results";
import { formatDate, formatDateTime } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Peserta acara" };

const PATH = "/ruang-kerja/peserta";

export default async function ParticipantsPage({
  searchParams,
}: PageProps<"/ruang-kerja/peserta">) {
  const user = await requirePermission("assessment:manage");
  const events = await assessableEvents(user.membership!.organization.id);
  const sp = await searchParams;
  const event =
    events.find((e) => e.id === param(sp, "acara")) ?? events[0] ?? null;
  if (!event) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Peserta acara"
          description="Kelola data peserta dan respons survei per milestone."
        />
        <EmptyState
          icon={UsersIcon}
          title="Belum ada acara terbit"
          description="Data peserta tersedia setelah acara diterbitkan."
        />
      </div>
    );
  }
  const q = param(sp, "q").trim().toLowerCase();
  const order = param(sp, "milestone");
  const survey = param(sp, "survei");
  const { milestones, rows } = await loadEventResults(event.id, event.kkm);
  const entries = rows.flatMap((r) =>
    r.cells.map((c) => ({ row: r, cell: c })),
  );
  const filtered = entries.filter(
    ({ row, cell }) =>
      (!q ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q)) &&
      (!order || String(cell.milestone.order) === order) &&
      (!survey ||
        (survey === "terkirim" ? Boolean(cell.response) : !cell.response)),
  );
  const page = pageOf(sp);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const responses = entries.filter((e) => e.cell.response).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Peserta acara"
        description={`${event.title} · Kelola data peserta dan respons survei per milestone.`}
      />
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="sm:w-96">
          <SearchParamSelect
            name="acara"
            label="Pilih acara"
            options={events.map((e) => ({ value: e.id, label: e.title }))}
          />
        </div>
        {event.startsAt && (
          <span className="text-small text-muted-foreground">
            {formatDate(event.startsAt)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={UsersIcon} label="Peserta acara" value={rows.length} />
        <StatCard
          icon={ClipboardCheckIcon}
          label="Respons survei terkirim"
          value={responses}
        />
        <StatCard
          icon={LayersIcon}
          label="Milestone acara"
          value={milestones.length}
        />
      </div>
      <SectionCard
        title="Data peserta per milestone"
        description="Satu baris mewakili respons survei seorang peserta pada satu milestone."
      >
        <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <SearchParamInput
            label="Cari peserta"
            placeholder="Cari nama atau email peserta…"
          />
          <SearchParamSelect
            name="milestone"
            label="Filter milestone"
            options={[
              { value: "semua", label: "Semua milestone" },
              ...milestones.map((m) => ({
                value: String(m.order),
                label: `Milestone ${m.order}`,
              })),
            ]}
          />
          <SearchParamSelect
            name="survei"
            label="Filter status survei"
            options={[
              { value: "semua", label: "Semua status survei" },
              { value: "terkirim", label: "Terkirim" },
              { value: "belum", label: "Belum diisi" },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama peserta</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Status survei</TableHead>
                <TableHead>Skor instrumen</TableHead>
                <TableHead>Dikirim</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-small text-muted-foreground"
                  >
                    Tidak ada data yang cocok.
                  </TableCell>
                </TableRow>
              )}
              {visible.map(({ row, cell }) => (
                <TableRow key={`${row.userId}-${cell.milestone.id}`}>
                  <TableCell>
                    <span className="block text-small-strong text-foreground">
                      {row.name}
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {row.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-small-strong text-foreground">
                      Milestone {cell.milestone.order}
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {cell.milestone.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-small">
                    {!cell.hasSurvey
                      ? "Tanpa survei"
                      : cell.response
                        ? "Terkirim"
                        : "Belum diisi"}
                  </TableCell>
                  <TableCell className="text-body-strong">
                    {cell.instrument === null ? "—" : `${cell.instrument} / 5`}
                  </TableCell>
                  <TableCell className="text-small">
                    {cell.response
                      ? formatDateTime(cell.response.submittedAt)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={
                        cell.latest
                          ? `/ruang-kerja/acara/${event.id}/nilai/${cell.latest.id}`
                          : `/ruang-kerja/galeri/${event.id}/${row.userId}`
                      }
                      className={buttonVariants({
                        size: "sm",
                        variant: "secondary",
                      })}
                    >
                      Lihat detail
                      <ArrowUpRightIcon aria-hidden="true" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <ListFooter
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            noun="respons"
            hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
          />
        </div>
      </SectionCard>
      <p className="flex items-start gap-2 text-caption text-muted-foreground">
        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Skor instrumen 1–5 adalah rata-rata jawaban skala survei, bukan nilai
        tugas.
      </p>
    </div>
  );
}
