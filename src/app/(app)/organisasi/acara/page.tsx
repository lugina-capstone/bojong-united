import {
  ArchiveIcon,
  CalendarCheckIcon,
  CalendarIcon,
  GraduationCapIcon,
  RefreshCwIcon,
} from "lucide-react";
import type { Metadata } from "next";

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
import { EventActions } from "@/app/(app)/organisasi/acara/event-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
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
import {
  organizationEventStatus,
  unfinishedEventWhere,
} from "@/lib/event-rules";
import { formatDate, formatNumber } from "@/lib/format";
import { requireOrganizationAdmin } from "@/lib/organization-access";

export const metadata: Metadata = { title: "Acara organisasi" };

const PATH = "/organisasi/acara";

// Acara terbit yang tanggal akhirnya sudah lewat dihitung "Selesai", sama seperti di Ruang Kerja.
function tabs(now: Date): {
  value: string;
  label: string;
  where: Prisma.EventWhereInput;
}[] {
  const finished: Prisma.EventWhereInput = {
    OR: [{ status: "CLOSED" }, { status: "PUBLISHED", endsAt: { lt: now } }],
  };
  return [
    {
      value: "semua",
      label: "Semua",
      where: { status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] } },
    },
    { value: "aktif", label: "Aktif", where: unfinishedEventWhere(now) },
    { value: "selesai", label: "Selesai", where: finished },
    { value: "diarsipkan", label: "Diarsipkan", where: { status: "ARCHIVED" } },
  ];
}

function dateRange(start: Date | null, end: Date | null) {
  if (!start && !end) return "Tanggal belum diatur";
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  return formatDate((start ?? end)!);
}

export default async function OrganizationEventsPage({
  searchParams,
}: PageProps<"/organisasi/acara">) {
  const { user, organizationId } =
    await requireOrganizationAdmin("member:manage");
  const params = (await searchParams) as SearchParams;
  const TABS = tabs(new Date());
  const tab = TABS.find((t) => t.value === param(params, "tab")) ?? TABS[0]!;
  const q = param(params, "q");
  const page = pageOf(params);

  const base: Prisma.EventWhereInput = {
    organizationId,
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };
  const where: Prisma.EventWhereInput = { AND: [base, tab.where] };

  const [
    organization,
    counts,
    events,
    total,
    active,
    closed,
    archived,
    participants,
    members,
  ] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true },
    }),
    Promise.all(
      TABS.map((t) => db.event.count({ where: { AND: [base, t.where] } })),
    ),
    db.event.findMany({
      where,
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
        creatorId: true,
        creator: { select: { name: true } },
        transferredFrom: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.event.count({ where }),
    db.event.count({ where: { organizationId, ...TABS[1]!.where } }),
    db.event.count({ where: { organizationId, ...TABS[2]!.where } }),
    db.event.count({ where: { organizationId, status: "ARCHIVED" } }),
    db.enrollment.count({ where: { event: { organizationId } } }),
    db.membership.findMany({
      where: { organizationId, status: "ACTIVE" },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);
  const memberOptions = members.map((member) => ({
    value: member.id,
    label: `${member.user.name} (${member.user.email})`,
    userId: member.userId,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Acara organisasi"
        description={`Semua acara yang diterbitkan atas nama ${organization.name}, termasuk acara yang dialihkan dari anggota yang keluar.`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarIcon}
          tone="success"
          label="Acara aktif"
          value={formatNumber(active)}
        />
        <StatCard
          icon={CalendarCheckIcon}
          tone="primary"
          label="Selesai"
          value={formatNumber(closed)}
        />
        <StatCard
          icon={ArchiveIcon}
          tone="neutral"
          label="Diarsipkan"
          value={formatNumber(archived)}
        />
        <StatCard
          icon={GraduationCapIcon}
          tone="warning"
          label="Peserta terlibat"
          value={formatNumber(participants)}
        />
      </div>
      <SectionCard
        title="Daftar acara"
        description="Acara draf hanya terlihat oleh pembuatnya."
      >
        <FilterBar
          className="px-4 pb-4 sm:px-5"
          search={
            <SearchParamInput
              label="Cari acara"
              placeholder="Cari judul acara…"
            />
          }
        />
        <LinkTabs
          label="Status acara"
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
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="Belum ada acara"
            description="Acara yang diterbitkan anggota organisasi akan tampil di sini."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acara</TableHead>
                <TableHead>Pengelola</TableHead>
                <TableHead>Peserta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex min-w-56 flex-col">
                      <span className="text-body-strong">{event.title}</span>
                      <span className="text-small text-muted-foreground">
                        {dateRange(event.startsAt, event.endsAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-44 flex-col items-start gap-1">
                      <span className="text-body-medium">
                        {event.creator.name}
                        {event.creatorId === user.id && " (Anda)"}
                      </span>
                      {event.transferredFrom && (
                        <Badge tone="neutral">
                          <RefreshCwIcon aria-hidden="true" />
                          Dialihkan dari {event.transferredFrom.name}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-body-strong">
                    {formatNumber(event._count.enrollments)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={organizationEventStatus(event).tone}>
                      {organizationEventStatus(event).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.status !== "DRAFT" && (
                      <EventActions
                        event={{
                          id: event.id,
                          title: event.title,
                          creatorId: event.creatorId,
                        }}
                        members={memberOptions}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <ListFooter
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          noun="acara"
          hrefFor={(p) => hrefWith(PATH, params, { page: p })}
        />
      </SectionCard>
    </div>
  );
}
