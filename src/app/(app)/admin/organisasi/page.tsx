import {
  BanIcon,
  Building2Icon,
  CircleCheckIcon,
  UsersIcon,
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
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { SectionCard } from "@/app/(app)/_components/section-card";
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
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { organizationTypes } from "@/lib/validations/auth";

export const metadata: Metadata = { title: "Kelola organisasi" };

const PATH = "/admin/organisasi";

export default async function ManageOrganizationsPage({
  searchParams,
}: PageProps<"/admin/organisasi">) {
  await requirePermission("organization:manage");
  const params = (await searchParams) as SearchParams;
  const q = param(params, "q");
  const type = param(params, "jenis");
  const status = param(params, "status");
  const page = pageOf(params);

  const where: Prisma.OrganizationWhereInput = {
    status:
      status === "aktif"
        ? "APPROVED"
        : status === "nonaktif"
          ? "DISABLED"
          : { in: ["APPROVED", "DISABLED"] },
    ...(organizationTypes.includes(type as never)
      ? { type: type as (typeof organizationTypes)[number] }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q.toUpperCase() } },
          ],
        }
      : {}),
  };

  const [organizations, total, all, active, disabled, members] =
    await Promise.all([
      db.organization.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          status: true,
          members: {
            where: { status: "ACTIVE" },
            select: { isAdmin: true, user: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { events: true } },
        },
      }),
      db.organization.count({ where }),
      db.organization.count({
        where: { status: { in: ["APPROVED", "DISABLED"] } },
      }),
      db.organization.count({ where: { status: "APPROVED" } }),
      db.organization.count({ where: { status: "DISABLED" } }),
      db.membership.count({
        where: {
          status: "ACTIVE",
          organization: { status: { in: ["APPROVED", "DISABLED"] } },
        },
      }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kelola organisasi"
        description="Pantau organisasi terdaftar, admin, jumlah anggota, dan status aktif."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2Icon}
          tone="primary"
          label="Total organisasi"
          value={formatNumber(all)}
        />
        <StatCard
          icon={CircleCheckIcon}
          tone="success"
          label="Aktif"
          value={formatNumber(active)}
        />
        <StatCard
          icon={BanIcon}
          tone="neutral"
          label="Nonaktif"
          value={formatNumber(disabled)}
        />
        <StatCard
          icon={UsersIcon}
          tone="primary"
          label="Anggota organisasi"
          value={formatNumber(members)}
        />
      </div>
      <SectionCard
        title="Daftar organisasi"
        description="Organisasi baru muncul di sini setelah pengajuannya disetujui."
      >
        <FilterBar
          className="px-4 pb-4 sm:px-5"
          search={
            <SearchParamInput
              label="Cari organisasi"
              placeholder="Cari nama organisasi atau kode…"
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
            name="status"
            label="Status"
            options={[
              { value: "semua", label: "Semua status" },
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Nonaktif" },
            ]}
          />
        </FilterBar>
        {organizations.length === 0 ? (
          <EmptyState
            icon={Building2Icon}
            title="Tidak ada organisasi"
            description="Organisasi yang cocok dengan filter akan tampil di sini."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisasi</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Acara</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => {
                const admins = organization.members.filter((m) => m.isAdmin);
                return (
                  <TableRow key={organization.id}>
                    <TableCell>
                      <div className="flex min-w-52 items-center gap-2.5">
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
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-small-strong text-label">
                        {organization.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-36 flex-col">
                        <span className="text-body-medium">
                          {admins[0]?.user.name ?? "—"}
                        </span>
                        {admins.length > 1 && (
                          <span className="text-small text-muted-foreground">
                            +{admins.length - 1} admin lainnya
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-body-strong">
                      {formatNumber(organization.members.length)}
                    </TableCell>
                    <TableCell className="text-body-strong">
                      {formatNumber(organization._count.events)}
                    </TableCell>
                    <TableCell>
                      <OrgStatusBadge status={organization.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`${PATH}/${organization.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "secondary",
                        })}
                      >
                        Kelola
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
          noun="organisasi"
          hrefFor={(p) => hrefWith(PATH, params, { page: p })}
        />
      </SectionCard>
    </div>
  );
}
