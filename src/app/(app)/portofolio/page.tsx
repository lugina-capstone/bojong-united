import {
  ArrowUpRightIcon,
  AwardIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  FolderOpenIcon,
  InfoIcon,
  LockIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { hrefWith, pageOf, param } from "@/app/(app)/_components/href";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
import { db } from "@/lib/db";
import { COVER_CLASS, coverToneFor } from "@/lib/event-cover";
import { finalScore } from "@/lib/event-rules";
import { formatDate, formatDateTime, formatScore } from "@/lib/format";
import { formatDuration, materialCover } from "@/lib/material-rules";
import { requirePermission } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Portofolio" };

const PATH = "/portofolio";
const PAGE_SIZE = 6;
const LEARNING_PAGE_SIZE = 10;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TABS = [
  { value: "karya", label: "Karya" },
  { value: "sertifikat", label: "Sertifikat" },
  { value: "belajar", label: "Riwayat belajar" },
] as const;
const FILTERS = [
  { value: "", label: "Semua acara" },
  { value: "sertifikat", label: "Sertifikat tersedia" },
  { value: "belum", label: "Penilaian belum lengkap" },
] as const;
const SORT_OPTIONS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "terlama", label: "Terlama" },
];

export default async function PortfolioPage({
  searchParams,
}: PageProps<"/portofolio">) {
  const user = await requirePermission("event:join");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === param(sp, "tab"))?.value ?? "karya";
  const q = param(sp, "q").trim().toLowerCase();
  const filter = param(sp, "filter");
  const sort = param(sp, "urut") === "terlama" ? "terlama" : "terbaru";

  const [enrollments, materials] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id, event: { status: { not: "DRAFT" } } },
      orderBy: { event: { endsAt: sort === "terlama" ? "asc" : "desc" } },
      select: {
        certificate: {
          select: { number: true, finalScore: true, issuedAt: true },
        },
        event: {
          select: {
            id: true,
            title: true,
            endsAt: true,
            kkm: true,
            certificateEnabled: true,
            field: { select: { name: true } },
            organization: { select: { name: true } },
            milestones: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                submissions: {
                  where: { userId: user.id },
                  orderBy: { version: "desc" },
                  take: 1,
                  select: { grade: { select: { score: true } } },
                },
              },
            },
          },
        },
      },
    }),
    db.materialEnrollment.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        progress: true,
        completedAt: true,
        updatedAt: true,
        material: {
          select: {
            id: true,
            title: true,
            coverColor: true,
            category: { select: { name: true } },
            organization: { select: { name: true } },
            sections: { select: { durationMinutes: true } },
          },
        },
      },
    }),
  ]);

  const works = enrollments.map(({ event, certificate }) => {
    const latest = event.milestones.map((m) => m.submissions[0] ?? null);
    const submitted = latest.filter(Boolean).length;
    const graded = latest.filter((s) => s?.grade).length;
    return {
      event,
      certificate,
      submitted,
      graded,
      total: event.milestones.length,
      final: finalScore(latest.map((s) => s?.grade?.score ?? null)),
    };
  });
  const filtered = works.filter(
    (w) =>
      (!q || w.event.title.toLowerCase().includes(q)) &&
      (filter !== "sertifikat" || w.certificate) &&
      (filter !== "belum" || w.graded < w.total),
  );
  const page = pageOf(sp);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleMaterials = materials.slice(
    (page - 1) * LEARNING_PAGE_SIZE,
    page * LEARNING_PAGE_SIZE,
  );
  const certificates = works.filter((w) => w.certificate);
  const completedMaterials = materials.filter((m) => m.completedAt);
  const weekAgo = new Date().getTime() - WEEK_MS;
  const completedThisWeek = completedMaterials.filter(
    (m) => m.completedAt && m.completedAt.getTime() >= weekAgo,
  ).length;
  const totalLearningMinutes = materials.reduce((sum, m) => {
    const mins = m.material.sections.reduce(
      (s, x) => s + (x.durationMinutes ?? 0),
      0,
    );
    return sum + Math.round((mins * m.progress) / 100);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Portofolio"
        description="Karya, sertifikat acara, dan riwayat belajar materi Anda."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={AwardIcon}
          label="Sertifikat acara"
          value={certificates.length}
        />
        <StatCard
          icon={BookOpenIcon}
          label="Materi diikuti"
          value={materials.length}
        />
        <StatCard
          icon={CheckCircle2Icon}
          tone="success"
          label="Materi selesai"
          value={completedMaterials.length}
          delta={
            completedThisWeek > 0
              ? `+${completedThisWeek} minggu ini`
              : undefined
          }
        />
        <StatCard
          icon={ClockIcon}
          tone="warning"
          label="Waktu belajar"
          value={
            totalLearningMinutes > 0
              ? formatDuration(totalLearningMinutes).replace(/^±\s*/, "")
              : "0 mnt"
          }
        />
      </div>

      <LinkTabs
        label="Bagian portofolio"
        active={tab}
        tabs={TABS.map((t) => ({
          value: t.value,
          label: t.label,
          count:
            t.value === "sertifikat"
              ? certificates.length
              : t.value === "belajar"
                ? materials.length
                : undefined,
          href: hrefWith(
            PATH,
            {},
            { tab: t.value === "karya" ? null : t.value },
          ),
        }))}
      />

      {tab === "karya" && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <h2 className="text-h2 text-foreground md:mr-auto">
              Riwayat karya
            </h2>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="sm:w-72">
                <SearchParamInput
                  label="Cari acara"
                  placeholder="Cari nama acara…"
                />
              </div>
              <div className="sm:w-36">
                <SearchParamSelect
                  name="urut"
                  label="Urutkan karya"
                  options={SORT_OPTIONS}
                  defaultValue="terbaru"
                />
              </div>
            </div>
          </div>
          <nav aria-label="Filter karya" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const count =
                f.value === "sertifikat"
                  ? certificates.length
                  : f.value === "belum"
                    ? works.filter((w) => w.graded < w.total).length
                    : works.length;
              return (
                <Link
                  key={f.value}
                  href={hrefWith(PATH, sp, { filter: f.value, page: null })}
                  aria-current={filter === f.value ? "true" : undefined}
                  className={buttonVariants({
                    size: "sm",
                    variant: filter === f.value ? "primary" : "secondary",
                  })}
                >
                  {f.label} ({count})
                </Link>
              );
            })}
          </nav>
          {visible.length === 0 ? (
            <EmptyState
              icon={FolderOpenIcon}
              title="Belum ada karya"
              description="Karya dari acara yang Anda ikuti akan tersimpan di sini."
              action={
                <Link href="/jelajah" className={buttonVariants()}>
                  Jelajah acara
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {visible.map((w) => (
                <article
                  key={w.event.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div
                    className={cn(
                      "flex flex-col gap-2.5 p-5",
                      COVER_CLASS[coverToneFor(w.event.id)],
                    )}
                  >
                    <span className="text-overline uppercase">
                      {w.event.field?.name ?? "Umum"}
                    </span>
                    <span className="text-small text-label">
                      {w.event.organization.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {w.event.milestones.map((m) => (
                        <span
                          key={m.id}
                          className="rounded-md bg-card px-2 py-0.5 text-caption text-muted-foreground"
                        >
                          {m.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-h2 text-foreground">
                        {w.event.title}
                      </h3>
                      {w.event.endsAt && (
                        <span className="text-small text-muted-foreground">
                          Selesai {formatDate(w.event.endsAt)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-small text-label">
                        <CheckCircle2Icon
                          aria-hidden="true"
                          className="size-4 text-success-500"
                        />
                        {w.submitted} dari {w.total} milestone selesai
                      </span>
                    </div>
                    <div className="flex items-center gap-4 border-t border-border pt-4">
                      <div className="flex flex-col">
                        <span className="text-caption text-muted-foreground">
                          Nilai akhir
                        </span>
                        <span
                          className={cn(
                            "text-stat",
                            w.final === null
                              ? "text-subtle"
                              : w.final >= w.event.kkm
                                ? "text-primary-500"
                                : "text-danger-600",
                          )}
                        >
                          {w.final === null ? "—" : formatScore(w.final)}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-1.5">
                        <span className="text-small-strong text-foreground">
                          {w.graded} dari {w.total} milestone sudah dinilai
                        </span>
                        <Progress
                          value={w.total === 0 ? 0 : (w.graded / w.total) * 100}
                        />
                      </div>
                    </div>
                    {w.certificate ? (
                      <div className="flex flex-col gap-1 rounded-xl bg-success-50 p-4">
                        <span className="flex items-center gap-2 text-h3 text-success-700">
                          <AwardIcon aria-hidden="true" className="size-4" />
                          Sertifikat tersedia
                        </span>
                        <span className="text-small text-muted-foreground">
                          Terbit otomatis pada{" "}
                          {formatDate(w.certificate.issuedAt)}. Nilai akhir{" "}
                          {formatScore(w.certificate.finalScore)} memenuhi KKM{" "}
                          {w.event.kkm}.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 rounded-xl bg-background p-4">
                        <span className="flex items-center gap-2 text-h3 text-label">
                          <ClockIcon aria-hidden="true" className="size-4" />
                          Sertifikat belum tersedia
                        </span>
                        <span className="text-small text-muted-foreground">
                          {!w.event.certificateEnabled
                            ? "Acara ini tidak menerbitkan sertifikat."
                            : w.final !== null && w.final < w.event.kkm
                              ? `Nilai akhir belum memenuhi KKM ${w.event.kkm}.`
                              : `Nilai akhir menunggu seluruh penilaian. Sertifikat terbit otomatis jika nilai akhir memenuhi minimum ${w.event.kkm}.`}
                        </span>
                      </div>
                    )}
                    <div className="mt-auto grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <Link
                        href={`/portofolio/${w.event.id}`}
                        className={buttonVariants({
                          variant: w.certificate ? "secondary" : "primary",
                        })}
                      >
                        Lihat acara
                        <ArrowUpRightIcon aria-hidden="true" />
                      </Link>
                      {w.certificate ? (
                        <Link
                          href={`/sertifikat/${encodeURIComponent(w.certificate.number)}/terbit`}
                          className={buttonVariants()}
                        >
                          Lihat sertifikat
                          <AwardIcon aria-hidden="true" />
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 text-button whitespace-nowrap text-muted-foreground select-none [&_svg]:size-4"
                        >
                          Sertifikat belum tersedia
                          <LockIcon aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {filtered.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <ListFooter
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                noun="acara"
                hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
              />
            </div>
          )}
          <p className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-4 text-small text-muted-foreground">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Sertifikat tersimpan otomatis per acara setelah seluruh milestone
            selesai, seluruh nilai tersedia, dan nilai akhir memenuhi syarat
            acara. Pemberitahuan penerbitan masuk ke notifikasi Anda.
          </p>
        </>
      )}

      {tab === "sertifikat" &&
        (certificates.length === 0 ? (
          <EmptyState
            icon={AwardIcon}
            title="Belum ada sertifikat"
            description="Sertifikat terbit otomatis setelah semua milestone dinilai dan nilai akhir memenuhi KKM."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {certificates.map((w) => (
              <li
                key={w.certificate!.number}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
              >
                <span className="text-caption text-muted-foreground">
                  No. {w.certificate!.number}
                </span>
                <h3 className="text-h3 text-foreground">{w.event.title}</h3>
                <span className="text-small text-label">
                  Nilai akhir {formatScore(w.certificate!.finalScore)} · terbit{" "}
                  {formatDateTime(w.certificate!.issuedAt)} WIB
                </span>
                <Link
                  href={`/sertifikat/${encodeURIComponent(w.certificate!.number)}/terbit`}
                  className={buttonVariants({ size: "sm", className: "w-fit" })}
                >
                  Lihat sertifikat
                  <ArrowUpRightIcon aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ))}

      {tab === "belajar" &&
        (materials.length === 0 ? (
          <EmptyState
            icon={BookOpenIcon}
            title="Belum ada riwayat belajar"
            description="Materi mandiri yang Anda ikuti akan tercatat di sini."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materi</TableHead>
                    <TableHead>Penyelenggara</TableHead>
                    <TableHead>Progres</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMaterials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex min-w-64 items-center gap-3">
                          <span
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-lg",
                              COVER_CLASS[materialCover(m.material.coverColor)],
                            )}
                          >
                            <BookOpenIcon
                              aria-hidden="true"
                              className="size-4.5"
                            />
                          </span>
                          <div className="flex min-w-0 flex-col">
                            {m.completedAt ? (
                              <Link
                                href={`/materi/${m.material.id}/selesai`}
                                className="truncate text-body-strong text-foreground hover:text-primary-600"
                              >
                                {m.material.title}
                              </Link>
                            ) : (
                              <span className="truncate text-body-strong text-foreground">
                                {m.material.title}
                              </span>
                            )}
                            <span className="text-small text-muted-foreground">
                              {m.completedAt
                                ? `Selesai ${formatDate(m.completedAt)}`
                                : `Terakhir dibuka ${formatDate(m.updatedAt)}`}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-small text-label">
                        {m.material.organization.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex w-36 items-center gap-2">
                          <Progress
                            value={m.progress}
                            label={`Progres ${m.material.title}`}
                          />
                          <span className="text-small-strong text-foreground">
                            {m.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          size="sm"
                          tone={m.completedAt ? "success" : "primary"}
                        >
                          {m.completedAt ? "Selesai" : "Sedang belajar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link
                          href={`/materi/${m.material.id}`}
                          className={buttonVariants({
                            variant: m.completedAt ? "secondary" : "primary",
                            size: "sm",
                          })}
                        >
                          {m.completedAt ? "Buka lagi" : "Lanjutkan"}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ListFooter
              page={page}
              pageSize={LEARNING_PAGE_SIZE}
              total={materials.length}
              noun="materi"
              hrefFor={(p) => hrefWith(PATH, { tab: "belajar" }, { page: p })}
            />
          </div>
        ))}
    </div>
  );
}
