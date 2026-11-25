import {
  ArrowRightIcon,
  ChartColumnIcon,
  DownloadIcon,
  InfoIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { param } from "@/app/(app)/_components/href";
import { SearchParamSelect } from "@/app/(app)/_components/list-controls";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assessableEvents, loadEventResults } from "@/lib/event-results";
import { formatDate, formatScore } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan acara" };

export default async function ReportPage({
  searchParams,
}: PageProps<"/ruang-kerja/laporan">) {
  const user = await requirePermission("assessment:manage");
  const events = await assessableEvents(user.membership!.organization.id);
  const sp = await searchParams;
  const event =
    events.find((e) => e.id === param(sp, "acara")) ?? events[0] ?? null;

  if (!event) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Laporan acara"
          description="Ringkasan progres, hasil penilaian, dan sertifikat dari acara terpilih."
        />
        <EmptyState
          icon={ChartColumnIcon}
          title="Belum ada acara terbit"
          description="Laporan tersedia setelah acara diterbitkan."
        />
      </div>
    );
  }

  const { milestones, rows } = await loadEventResults(event.id, event.kkm);
  const tasks = rows.length * milestones.length;
  const done = rows.reduce(
    (sum, r) =>
      sum +
      r.cells.filter((c) => c.latest && (!c.hasSurvey || c.response)).length,
    0,
  );
  const finals = rows.flatMap((r) => (r.final === null ? [] : [r.final]));
  const average =
    finals.length === 0
      ? null
      : finals.reduce((a, b) => a + b, 0) / finals.length;
  const passed = rows.filter((r) => r.kkmStatus === "lulus").length;
  const below = rows.filter((r) => r.kkmStatus === "bawah").length;
  const pending = rows.length - passed - below;
  const pct = (n: number) => (rows.length === 0 ? 0 : (n / rows.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan acara"
        description="Ringkasan progres, hasil penilaian, dan sertifikat dari acara terpilih."
      />
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <SearchParamSelect
          name="acara"
          label="Pilih acara"
          options={events.map((e) => ({ value: e.id, label: e.title }))}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-h1 text-foreground">{event.title}</h2>
          <p className="text-small text-muted-foreground">
            {event.startsAt && event.endsAt
              ? `${formatDate(event.startsAt)} – ${formatDate(event.endsAt)} · `
              : ""}
            Dibuat {formatDate(event.createdAt)}
          </p>
        </div>
        <a
          href={`/api/acara/${event.id}/rekap`}
          className={buttonVariants({
            variant: "secondary",
            className: "w-fit",
          })}
        >
          <DownloadIcon aria-hidden="true" />
          Unduh CSV
        </a>
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Peserta",
            value: rows.length,
            note: "Seluruh peserta acara",
          },
          {
            label: "Pekerjaan selesai",
            value: `${done} / ${tasks}`,
            note: "Milestone dan survei selesai",
          },
          {
            label: "Rata-rata progres",
            value: `${tasks === 0 ? 0 : Math.round((done / tasks) * 100)}%`,
            note: `Berdasarkan ${milestones.length} milestone per peserta`,
          },
          {
            label: "Rata-rata nilai akhir",
            value: average === null ? "—" : formatScore(average),
            note: `Dari ${finals.length} peserta dengan nilai lengkap`,
            highlight: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "flex flex-col gap-1 rounded-2xl border p-5",
              s.highlight
                ? "border-primary-200 bg-primary-50"
                : "border-border bg-card",
            )}
          >
            <dt className="text-small text-label">{s.label}</dt>
            <dd className="text-h1 text-foreground">{s.value}</dd>
            <dd className="text-caption text-muted-foreground">{s.note}</dd>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-1 lg:w-72">
          <h2 className="text-h3 text-foreground">Status KKM peserta</h2>
          <p className="text-caption text-muted-foreground">
            KKM nilai akhir: {event.kkm} · dihitung setelah semua milestone
            dinilai
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div
            className="flex h-3 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${passed} lulus, ${below} di bawah KKM, ${pending} belum lengkap`}
          >
            <span
              className="bg-primary-500"
              style={{ width: `${pct(passed)}%` }}
            />
            <span
              className="bg-warning-500"
              style={{ width: `${pct(below)}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption">
            <span className="text-primary-600">{passed} peserta lulus KKM</span>
            <span className="text-warning-700">
              {below} peserta di bawah KKM
            </span>
            <span className="text-muted-foreground">
              {pending} belum lengkap
            </span>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-h2 text-foreground">Ringkasan peserta</h2>
            <p className="text-small text-muted-foreground">
              Nilai akhir dan kondisi sertifikat setiap peserta.
            </p>
          </div>
          <Link
            href={`/ruang-kerja/tugas/${event.id}/rekap`}
            className={buttonVariants({ className: "w-fit" })}
          >
            Lihat detail lengkap
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama peserta</TableHead>
                <TableHead>Progres</TableHead>
                <TableHead>Penilaian</TableHead>
                <TableHead>Nilai akhir</TableHead>
                <TableHead>Status KKM &amp; sertifikat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-small text-muted-foreground"
                  >
                    Belum ada peserta.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.userId}>
                  <TableCell className="text-small-strong">{r.name}</TableCell>
                  <TableCell className="text-small">
                    {r.submitted} dari {milestones.length}
                  </TableCell>
                  <TableCell>
                    <Badge
                      size="sm"
                      tone={
                        r.graded === milestones.length ? "primary" : "neutral"
                      }
                    >
                      {r.graded === milestones.length
                        ? "Sudah dinilai"
                        : `${r.graded}/${milestones.length} dinilai`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-body-strong">
                    {r.final === null ? "—" : formatScore(r.final)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge
                        size="sm"
                        className="w-fit"
                        tone={
                          r.kkmStatus === "lulus"
                            ? "success"
                            : r.kkmStatus === "bawah"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {r.kkmStatus === "lulus"
                          ? "KKM lulus"
                          : r.kkmStatus === "bawah"
                            ? "Di bawah KKM"
                            : "Belum lengkap"}
                      </Badge>
                      <span className="text-caption text-muted-foreground">
                        {r.certificate ? "Terbit otomatis" : "Belum terbit"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <p className="flex items-start gap-2 text-caption text-muted-foreground">
        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Rata-rata nilai akhir dihitung dari peserta dengan seluruh nilai
        milestone tersedia. Sertifikat terbit otomatis setelah seluruh syarat
        acara terpenuhi.
      </p>
    </div>
  );
}
