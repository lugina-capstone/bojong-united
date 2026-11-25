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
import { SearchParamInput } from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { finalScore } from "@/lib/event-rules";
import { formatDate, formatDateTime, formatScore } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Portofolio" };

const PATH = "/portofolio";
const PAGE_SIZE = 6;
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

export default async function PortfolioPage({
  searchParams,
}: PageProps<"/portofolio">) {
  const user = await requirePermission("event:join");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === param(sp, "tab"))?.value ?? "karya";
  const q = param(sp, "q").trim().toLowerCase();
  const filter = param(sp, "filter");

  const [enrollments, materials] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id, event: { status: { not: "DRAFT" } } },
      orderBy: { event: { endsAt: "desc" } },
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
            category: { select: { name: true } },
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
  const certificates = works.filter((w) => w.certificate);
  const completedMaterials = materials.filter((m) => m.completedAt).length;

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
          icon={FolderOpenIcon}
          label="Acara diikuti"
          value={works.length}
        />
        <StatCard
          icon={BookOpenIcon}
          label="Materi diikuti"
          value={materials.length}
        />
        <StatCard
          icon={CheckCircle2Icon}
          label="Materi selesai"
          value={completedMaterials}
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
            <div className="md:w-80">
              <SearchParamInput
                label="Cari acara"
                placeholder="Cari nama acara…"
              />
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visible.map((w) => (
                <article
                  key={w.event.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="flex flex-col gap-2 bg-primary-50 p-5">
                    <span className="text-caption-strong text-primary-600 uppercase">
                      {w.event.field?.name ?? "Umum"}
                    </span>
                    <span className="text-small text-label">
                      {w.event.organization.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {w.event.milestones.map((m) => (
                        <span
                          key={m.id}
                          className="rounded-md bg-card px-2 py-0.5 text-caption text-label"
                        >
                          {m.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-h3 text-foreground">
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
                        {w.submitted} dari {w.total} milestone dikumpulkan
                      </span>
                    </div>
                    <div className="flex items-center gap-4 border-t border-border pt-4">
                      <div className="flex flex-col">
                        <span className="text-caption text-muted-foreground">
                          Nilai akhir
                        </span>
                        <span
                          className={cn(
                            "text-h2",
                            w.final === null
                              ? "text-subtle"
                              : w.final >= w.event.kkm
                                ? "text-primary-600"
                                : "text-danger-700",
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
                        <span className="flex items-center gap-2 text-body-strong text-success-700">
                          <AwardIcon aria-hidden="true" className="size-4" />
                          Sertifikat tersedia
                        </span>
                        <span className="text-small text-label">
                          Terbit otomatis pada{" "}
                          {formatDate(w.certificate.issuedAt)}. Nilai akhir{" "}
                          {formatScore(w.certificate.finalScore)} memenuhi KKM{" "}
                          {w.event.kkm}.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 rounded-xl bg-muted p-4">
                        <span className="flex items-center gap-2 text-body-strong text-foreground">
                          <ClockIcon aria-hidden="true" className="size-4" />
                          Sertifikat belum tersedia
                        </span>
                        <span className="text-small text-label">
                          {!w.event.certificateEnabled
                            ? "Acara ini tidak menerbitkan sertifikat."
                            : w.final !== null && w.final < w.event.kkm
                              ? `Nilai akhir belum memenuhi KKM ${w.event.kkm}.`
                              : `Sertifikat terbit otomatis jika semua milestone dinilai dan nilai akhir minimal ${w.event.kkm}.`}
                        </span>
                      </div>
                    )}
                    <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Link
                        href={`/acara/${w.event.id}`}
                        className={buttonVariants({ variant: "secondary" })}
                      >
                        Lihat acara
                        <ArrowUpRightIcon aria-hidden="true" />
                      </Link>
                      {w.certificate ? (
                        <Link
                          href={`/sertifikat/${w.certificate.number}`}
                          className={buttonVariants()}
                        >
                          Lihat sertifikat
                          <AwardIcon aria-hidden="true" />
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className={buttonVariants({
                            variant: "secondary",
                            className: "pointer-events-none opacity-60",
                          })}
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
          <ListFooter
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            noun="acara"
            hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
          />
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
                  {formatDateTime(w.certificate!.issuedAt)}
                </span>
                <Link
                  href={`/sertifikat/${w.certificate!.number}`}
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
          <ul className="flex flex-col gap-3">
            {materials.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-caption text-muted-foreground">
                    {m.material.category.name}
                  </span>
                  <Link
                    href={
                      m.completedAt
                        ? `/materi/${m.material.id}/selesai`
                        : `/materi/${m.material.id}`
                    }
                    className="text-body-strong text-foreground hover:text-primary-600"
                  >
                    {m.material.title}
                  </Link>
                  <span className="text-caption text-muted-foreground">
                    {m.completedAt
                      ? `Selesai ${formatDate(m.completedAt)}`
                      : `Terakhir dibuka ${formatDate(m.updatedAt)}`}
                  </span>
                </div>
                <div className="flex w-full flex-col gap-1 sm:w-48">
                  <span className="text-small text-label">{m.progress}%</span>
                  <Progress value={m.progress} />
                </div>
              </li>
            ))}
          </ul>
        ))}

      <p className="flex items-start gap-2 rounded-2xl border border-border bg-card p-4 text-caption text-muted-foreground">
        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Sertifikat tersimpan otomatis per acara setelah seluruh milestone
        selesai, seluruh nilai tersedia, dan nilai akhir memenuhi syarat acara.
      </p>
    </div>
  );
}
