import {
  ArrowUpRightIcon,
  CalendarClockIcon,
  ClipboardCheckIcon,
  HourglassIcon,
  InfoIcon,
  RotateCcwIcon,
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
import { SectionCard } from "@/app/(app)/_components/section-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatScore } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Tugas & penilaian" };

const PATH = "/ruang-kerja/tugas";
const TABS = [
  { value: "perlu", label: "Perlu dinilai" },
  { value: "menunggu", label: "Menunggu revisi" },
  { value: "sudah", label: "Sudah dinilai" },
  { value: "belum", label: "Belum mengumpulkan" },
] as const;
type Tab = (typeof TABS)[number]["value"];

type Row = {
  key: string;
  tab: Tab;
  name: string;
  eventId: string;
  eventTitle: string;
  milestoneId: string;
  milestoneLabel: string;
  submissionId: string | null;
  at: Date;
  version: number | null;
  score: number | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function TasksPage({
  searchParams,
}: PageProps<"/ruang-kerja/tugas">) {
  const user = await requirePermission("assessment:manage");
  const organizationId = user.membership!.organization.id;
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === param(sp, "tab"))?.value ?? "perlu";
  const q = param(sp, "q").trim().toLowerCase();
  const eventFilter = param(sp, "acara");
  const orderFilter = param(sp, "milestone");
  const now = new Date();

  const events = await db.event.findMany({
    where: {
      organizationId,
      creatorId: user.id,
      status: { in: ["PUBLISHED", "CLOSED"] },
    },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      enrollments: {
        select: {
          userId: true,
          user: { select: { name: true } },
          team: { select: { name: true } },
        },
      },
      milestones: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          title: true,
          dueAt: true,
          submissions: {
            orderBy: { version: "desc" },
            select: {
              id: true,
              userId: true,
              version: true,
              status: true,
              submittedAt: true,
              grade: { select: { score: true, gradedAt: true } },
              revisionRequest: { select: { createdAt: true } },
            },
          },
        },
      },
    },
  });

  const rows: Row[] = [];
  let revisionsIn = 0;
  for (const ev of events) {
    const started = Boolean(ev.startsAt && ev.startsAt <= now);
    for (const m of ev.milestones) {
      for (const en of ev.enrollments) {
        const latest = m.submissions.find((s) => s.userId === en.userId);
        const base = {
          key: `${m.id}-${en.userId}`,
          name: en.user.name,
          eventId: ev.id,
          eventTitle: ev.title,
          milestoneId: m.id,
          milestoneLabel: `Milestone ${m.order} · ${en.team?.name ?? m.title}`,
        };
        if (!latest) {
          if (started)
            rows.push({
              ...base,
              tab: "belum",
              submissionId: null,
              at: m.dueAt ?? ev.startsAt!,
              version: null,
              score: null,
            });
          continue;
        }
        const tabOf: Tab =
          latest.status === "GRADED"
            ? "sudah"
            : latest.status === "REVISION_REQUESTED"
              ? "menunggu"
              : "perlu";
        if (tabOf === "perlu" && latest.version > 1) revisionsIn++;
        rows.push({
          ...base,
          tab: tabOf,
          submissionId: latest.id,
          at:
            tabOf === "sudah"
              ? (latest.grade?.gradedAt ?? latest.submittedAt)
              : tabOf === "menunggu"
                ? (latest.revisionRequest?.createdAt ?? latest.submittedAt)
                : latest.submittedAt,
          version: latest.version,
          score: latest.grade?.score ?? null,
        });
      }
    }
  }

  const counts = Object.fromEntries(
    TABS.map((t) => [t.value, rows.filter((r) => r.tab === t.value).length]),
  ) as Record<Tab, number>;
  const filtered = rows
    .filter(
      (r) =>
        r.tab === tab &&
        (!q || r.name.toLowerCase().includes(q)) &&
        (!eventFilter || r.eventId === eventFilter) &&
        (!orderFilter ||
          r.milestoneLabel.startsWith(`Milestone ${orderFilter} `)),
    )
    .sort((a, b) =>
      tab === "sudah"
        ? b.at.getTime() - a.at.getTime()
        : a.at.getTime() - b.at.getTime(),
    );
  const page = pageOf(sp);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxOrder = Math.max(0, ...events.map((e) => e.milestones.length));
  const timeLabel =
    tab === "sudah"
      ? "Dinilai"
      : tab === "menunggu"
        ? "Revisi diminta"
        : tab === "belum"
          ? "Tenggat"
          : "Dikumpulkan";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tugas & penilaian"
        description="Semua pengumpulan tugas dari acara Anda yang perlu ditindaklanjuti, tanpa membuka acara satu per satu."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardCheckIcon}
          label="Perlu dinilai"
          value={counts.perlu - revisionsIn}
        />
        <StatCard
          icon={RotateCcwIcon}
          label="Revisi masuk"
          value={revisionsIn}
        />
        <StatCard
          icon={HourglassIcon}
          label="Menunggu revisi peserta"
          value={counts.menunggu}
        />
        <StatCard
          icon={CalendarClockIcon}
          label="Belum mengumpulkan"
          value={counts.belum}
        />
      </div>

      <SectionCard
        title="Pantau progres per acara"
        description="Buka tabel peserta × milestone untuk menilai dan memantau setiap acara."
      >
        {events.length === 0 ? (
          <p className="px-4 pb-5 text-small text-muted-foreground sm:px-5">
            Belum ada acara terbit.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {events.map((ev) => {
              const pending = rows.filter(
                (r) => r.eventId === ev.id && r.tab === "perlu",
              ).length;
              return (
                <li
                  key={ev.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-small-strong text-foreground">
                      {ev.title}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {ev.enrollments.length} peserta · {ev.milestones.length}{" "}
                      milestone · {pending} perlu dinilai
                    </span>
                  </div>
                  <Link
                    href={`${PATH}/${ev.id}`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: "w-fit shrink-0",
                    })}
                  >
                    Pantau progres
                    <ArrowUpRightIcon aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
      <SectionCard>
        <div className="flex flex-col gap-3 px-4 pt-4 sm:px-5">
          <LinkTabs
            label="Status tugas"
            active={tab}
            tabs={TABS.map((t) => ({
              value: t.value,
              label: t.label,
              count: counts[t.value],
              href: hrefWith(PATH, sp, {
                tab: t.value === "perlu" ? null : t.value,
                page: null,
              }),
            }))}
          />
          <div className="grid grid-cols-1 gap-3 pb-4 md:grid-cols-[minmax(0,1fr)_14rem_12rem]">
            <SearchParamInput
              label="Cari peserta"
              placeholder="Cari nama peserta…"
            />
            <SearchParamSelect
              name="acara"
              label="Filter acara"
              options={[
                { value: "semua", label: "Semua acara" },
                ...events.map((e) => ({ value: e.id, label: e.title })),
              ]}
            />
            <SearchParamSelect
              name="milestone"
              label="Filter milestone"
              options={[
                { value: "semua", label: "Semua milestone" },
                ...Array.from({ length: maxOrder }, (_, i) => ({
                  value: String(i + 1),
                  label: `Milestone ${i + 1}`,
                })),
              ]}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peserta</TableHead>
                <TableHead>Acara · Milestone</TableHead>
                <TableHead>{timeLabel}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-small text-muted-foreground"
                  >
                    Tidak ada tugas di tab ini.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r) => (
                <TableRow key={r.key}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-caption-strong text-primary-600">
                        {initials(r.name)}
                      </span>
                      <span className="text-small-strong text-foreground">
                        {r.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block text-small-strong text-foreground">
                      {r.eventTitle}
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {r.milestoneLabel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-small text-foreground">
                      {r.tab === "belum"
                        ? formatDate(r.at)
                        : formatDateTime(r.at)}
                    </span>
                    {r.version && (
                      <span className="block text-caption text-muted-foreground">
                        Versi {r.version}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.tab === "perlu" ? (
                      <Badge tone="warning" size="sm">
                        {r.version && r.version > 1
                          ? "Revisi masuk"
                          : "Perlu dinilai"}
                      </Badge>
                    ) : r.tab === "menunggu" ? (
                      <Badge tone="neutral" size="sm">
                        Menunggu revisi
                      </Badge>
                    ) : r.tab === "sudah" ? (
                      <Badge tone="success" size="sm">
                        Nilai {formatScore(r.score ?? 0)}
                      </Badge>
                    ) : (
                      <Badge tone="danger" size="sm">
                        {r.at < now ? "Lewat tenggat" : "Belum kumpul"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={
                        r.submissionId
                          ? `/ruang-kerja/tugas/${r.eventId}/nilai/${r.submissionId}`
                          : `/ruang-kerja/tugas/${r.eventId}`
                      }
                      className={buttonVariants({
                        size: "sm",
                        variant:
                          r.tab === "perlu" && r.version === 1
                            ? "primary"
                            : "secondary",
                      })}
                    >
                      {r.tab === "perlu"
                        ? r.version === 1
                          ? "Nilai"
                          : "Periksa ulang"
                        : r.tab === "belum"
                          ? "Pantau"
                          : "Rincian"}
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
            noun="tugas"
            hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
          />
        </div>
      </SectionCard>
      <p className="flex items-start gap-2 text-caption text-muted-foreground">
        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Diurutkan dari pengumpulan yang paling lama menunggu. Revisi masuk
        dibuka lewat Periksa ulang.
      </p>
    </div>
  );
}
