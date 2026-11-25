import {
  AwardIcon,
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  UsersIcon,
  XCircleIcon,
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
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAssessableEvent } from "@/lib/assessment";
import {
  kkmStatusLabel,
  loadEventResults,
  type KkmStatus,
} from "@/lib/event-results";
import { formatDate, formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rekap akhir acara" };

const TABS = [
  { value: "semua", label: "Semua" },
  { value: "lulus", label: "Mencapai KKM" },
  { value: "bawah", label: "Di bawah KKM" },
  { value: "belum", label: "Belum lengkap" },
] as const;

const KKM_TONE: Record<KkmStatus, "success" | "danger" | "neutral"> = {
  lulus: "success",
  bawah: "danger",
  belum: "neutral",
};

export default async function RecapPage({
  params,
  searchParams,
}: PageProps<"/ruang-kerja/acara/[id]/rekap">) {
  const { id } = await params;
  const { event } = await requireAssessableEvent(id);
  const sp = await searchParams;
  const PATH = `/ruang-kerja/acara/${id}/rekap`;
  const tab = TABS.find((t) => t.value === param(sp, "tab"))?.value ?? "semua";
  const { milestones, rows } = await loadEventResults(id, event.kkm);
  const count = (s: KkmStatus) => rows.filter((r) => r.kkmStatus === s).length;
  const filtered =
    tab === "semua" ? rows : rows.filter((r) => r.kkmStatus === tab);
  const page = pageOf(sp);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/acara" className="hover:text-foreground">
          Acara Saya
        </Link>{" "}
        /{" "}
        <Link
          href={`/ruang-kerja/acara/${id}`}
          className="hover:text-foreground"
        >
          {event.title}
        </Link>{" "}
        / Rekap akhir
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-foreground">Rekap akhir acara</h1>
          <p className="text-small text-muted-foreground">
            {event.endsAt && `Acara berakhir ${formatDate(event.endsAt)}. `}
            Nilai akhir = rata-rata nilai semua milestone. Sertifikat terbit
            otomatis untuk peserta yang mencapai KKM {event.kkm}.
          </p>
        </div>
        <a
          href={`/api/acara/${id}/rekap`}
          className={buttonVariants({
            variant: "secondary",
            className: "w-fit shrink-0",
          })}
        >
          <DownloadIcon aria-hidden="true" />
          Unduh rekap (CSV)
        </a>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersIcon} label="Total peserta" value={rows.length} />
        <StatCard
          icon={CheckCircle2Icon}
          label="Mencapai KKM"
          value={count("lulus")}
        />
        <StatCard
          icon={XCircleIcon}
          label="Di bawah KKM"
          value={count("bawah")}
        />
        <StatCard
          icon={ClockIcon}
          label="Belum lengkap"
          value={count("belum")}
        />
      </div>
      <SectionCard
        title="Hasil akhir peserta"
        description="Peserta menerima notifikasi setiap nilai dan sertifikat terbit."
      >
        <div className="px-4 sm:px-5">
          <LinkTabs
            label="Filter hasil"
            active={tab}
            tabs={TABS.map((t) => ({
              value: t.value,
              label: t.label,
              count: t.value === "semua" ? rows.length : count(t.value),
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
                <TableHead>Peserta</TableHead>
                <TableHead>Milestone dinilai</TableHead>
                <TableHead>Nilai akhir</TableHead>
                <TableHead>Status KKM</TableHead>
                <TableHead>Sertifikat</TableHead>
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
                    Tidak ada peserta di tab ini.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r) => (
                <TableRow key={r.userId}>
                  <TableCell>
                    <span className="block text-small-strong text-foreground">
                      {r.name}
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {r.team ?? r.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-small-strong">
                    {r.graded}/{milestones.length}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-body-strong",
                        r.kkmStatus === "bawah"
                          ? "text-danger-700"
                          : "text-foreground",
                      )}
                    >
                      {r.final === null ? "—" : formatScore(r.final)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge size="sm" tone={KKM_TONE[r.kkmStatus]}>
                      {kkmStatusLabel[r.kkmStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.certificate ? (
                      <Link
                        href={`/sertifikat/${r.certificate}`}
                        className="inline-flex items-center gap-1 text-small text-success-700 hover:underline"
                      >
                        <AwardIcon aria-hidden="true" className="size-4" />
                        Terbit
                      </Link>
                    ) : (
                      <Badge size="sm" tone="neutral">
                        Tidak terbit
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/ruang-kerja/galeri/${id}/${r.userId}`}
                      className={buttonVariants({
                        size: "sm",
                        variant: "secondary",
                      })}
                    >
                      Detail
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
            noun="peserta"
            hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
          />
        </div>
      </SectionCard>
    </div>
  );
}
