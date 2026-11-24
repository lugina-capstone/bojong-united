import {
  ArrowRightIcon,
  Building2Icon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  InboxIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { OrgStatusBadge, orgTypeLabel } from "@/app/(app)/_components/badges";
import {
  hrefWith,
  PAGE_SIZE,
  pageOf,
  param,
  type SearchParams,
} from "@/app/(app)/_components/href";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { SectionCard } from "@/app/(app)/_components/section-card";
import {
  applicantSelect,
  startOfMonth,
  verifiedApplicant,
} from "@/app/(app)/admin/queries";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { OrgLogo } from "@/components/ui/org-logo";
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
import type { OrganizationStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  formatDate,
  formatNumber,
  formatTime,
  workingDaysSince,
} from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { organizationTypes } from "@/lib/validations/auth";

export const metadata: Metadata = { title: "Persetujuan organisasi" };

const TABS = [
  { value: "menunggu", label: "Menunggu", status: ["PENDING"] },
  { value: "disetujui", label: "Disetujui", status: ["APPROVED", "DISABLED"] },
  { value: "ditolak", label: "Ditolak", status: ["REJECTED"] },
  {
    value: "semua",
    label: "Semua",
    status: ["PENDING", "APPROVED", "DISABLED", "REJECTED"],
  },
] as const satisfies {
  value: string;
  label: string;
  status: OrganizationStatus[];
}[];

const PATH = "/admin/persetujuan";

export default async function ApprovalQueuePage({
  searchParams,
}: PageProps<"/admin/persetujuan">) {
  await requirePermission("organization:review");
  const params = (await searchParams) as SearchParams;
  const tab = TABS.find((t) => t.value === param(params, "tab")) ?? TABS[0];
  const q = param(params, "q");
  const type = param(params, "jenis");
  const newest = param(params, "urut") === "terbaru";
  const page = pageOf(params);

  const base: Prisma.OrganizationWhereInput = {
    ...verifiedApplicant,
    ...(organizationTypes.includes(type as never)
      ? { type: type as (typeof organizationTypes)[number] }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            {
              members: {
                some: {
                  isAdmin: true,
                  user: {
                    OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { email: { contains: q.toLowerCase() } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
  const where = { ...base, status: { in: [...tab.status] } };
  const month = startOfMonth();

  const [
    counts,
    organizations,
    total,
    pending,
    approvedMonth,
    rejectedMonth,
    active,
  ] = await Promise.all([
    Promise.all(
      TABS.map((t) =>
        db.organization.count({
          where: { ...base, status: { in: [...t.status] } },
        }),
      ),
    ),
    db.organization.findMany({
      where,
      orderBy: { createdAt: newest ? "desc" : "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        rejectionReason: true,
        ...applicantSelect,
      },
    }),
    db.organization.count({ where }),
    db.organization.count({
      where: { ...verifiedApplicant, status: "PENDING" },
    }),
    db.organization.count({
      where: {
        status: { in: ["APPROVED", "DISABLED"] },
        reviewedAt: { gte: month },
      },
    }),
    db.organization.count({
      where: { status: "REJECTED", reviewedAt: { gte: month } },
    }),
    db.organization.count({ where: { status: "APPROVED" } }),
  ]);

  const showReason = tab.value === "ditolak";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Persetujuan organisasi"
        description="Tinjau pengajuan organisasi baru. Target peninjauan 1–2 hari kerja sejak email pemohon terverifikasi."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClockIcon}
          tone="warning"
          label="Menunggu persetujuan"
          value={formatNumber(pending)}
        />
        <StatCard
          icon={CircleCheckIcon}
          tone="success"
          label="Disetujui bulan ini"
          value={formatNumber(approvedMonth)}
        />
        <StatCard
          icon={CircleXIcon}
          tone="neutral"
          label="Ditolak bulan ini"
          value={formatNumber(rejectedMonth)}
        />
        <StatCard
          icon={Building2Icon}
          tone="primary"
          label="Organisasi aktif"
          value={formatNumber(active)}
        />
      </div>
      <SectionCard
        title="Daftar pengajuan"
        description={
          newest
            ? "Diurutkan dari pengajuan terbaru."
            : "Diurutkan dari pengajuan terlama."
        }
      >
        <FilterBar
          className="px-4 pb-4 sm:px-5"
          search={
            <SearchParamInput
              label="Cari pengajuan"
              placeholder="Cari organisasi atau pemohon…"
            />
          }
        >
          <SearchParamSelect
            name="jenis"
            label="Jenis organisasi"
            options={[
              { value: "semua", label: "Semua jenis organisasi" },
              ...organizationTypes.map((value) => ({
                value,
                label: orgTypeLabel(value),
              })),
            ]}
          />
          <SearchParamSelect
            name="urut"
            label="Urutan"
            options={[
              { value: "terlama", label: "Terlama dulu" },
              { value: "terbaru", label: "Terbaru dulu" },
            ]}
          />
        </FilterBar>
        <LinkTabs
          label="Status pengajuan"
          active={tab.value}
          tabs={TABS.map((t, i) => ({
            value: t.value,
            label: t.label,
            count: counts[i],
            href: hrefWith(PATH, params, {
              tab: t.value === "menunggu" ? null : t.value,
              page: null,
            }),
          }))}
        />
        {organizations.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="Tidak ada pengajuan"
            description="Pengajuan yang cocok dengan filter akan tampil di sini."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisasi</TableHead>
                <TableHead>Pemohon</TableHead>
                {showReason && <TableHead>Alasan penolakan</TableHead>}
                <TableHead>{showReason ? "Ditolak" : "Diajukan"}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => {
                const applicant = organization.members[0]?.user;
                const late =
                  organization.status === "PENDING" &&
                  workingDaysSince(organization.createdAt) >= 2;
                const date = showReason
                  ? (organization.reviewedAt ?? organization.createdAt)
                  : organization.createdAt;
                return (
                  <TableRow key={organization.id}>
                    <TableCell>
                      <div className="flex min-w-56 items-center gap-2.5">
                        <OrgLogo
                          name={organization.name}
                          className="size-9 rounded-lg text-small-strong"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="text-body-strong">
                            {organization.name}
                          </span>
                          <span className="text-small text-muted-foreground">
                            {orgTypeLabel(organization.type)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-48 flex-col">
                        <span className="text-body-medium">
                          {applicant?.name ?? "—"}
                        </span>
                        <span className="text-small text-muted-foreground">
                          {applicant?.email}
                        </span>
                      </div>
                    </TableCell>
                    {showReason && (
                      <TableCell className="max-w-72 min-w-56 text-small whitespace-normal text-label">
                        {organization.rejectionReason}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex min-w-28 flex-col">
                        <span>{formatDate(date)}</span>
                        <span
                          className={
                            late
                              ? "text-small text-danger-500"
                              : "text-small text-muted-foreground"
                          }
                        >
                          {formatTime(date)}
                          {late && " · Lewat 2 hari kerja"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrgStatusBadge
                        status={organization.status}
                        label={
                          organization.status === "REJECTED"
                            ? "Belum diajukan ulang"
                            : undefined
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`${PATH}/${organization.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant:
                            organization.status === "PENDING"
                              ? "primary"
                              : "secondary",
                        })}
                      >
                        {organization.status === "PENDING" ? "Tinjau" : "Lihat"}
                        <ArrowRightIcon aria-hidden="true" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <ListFooter
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          noun="pengajuan"
          hrefFor={(p) => hrefWith(PATH, params, { page: p })}
        />
      </SectionCard>
    </div>
  );
}
