import {
  GraduationCapIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminBadge,
  PesertaBadge,
  RoleBadge,
} from "@/app/(app)/_components/badges";
import {
  hrefWith,
  PAGE_SIZE,
  pageOf,
  param,
  type SearchParams,
} from "@/app/(app)/_components/href";
import { InfoRows } from "@/app/(app)/_components/info-rows";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { DetailSheet } from "@/app/(app)/_components/detail-sheet";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { UserRow } from "@/components/ui/user-row";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelative,
} from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Pengguna" };

const PATH = "/admin/pengguna";
const activeMember: Prisma.MembershipWhereInput = {
  status: "ACTIVE",
  organization: { status: { in: ["APPROVED", "DISABLED"] } },
};

const TABS: { value: string; label: string; where: Prisma.UserWhereInput }[] = [
  { value: "semua", label: "Semua", where: {} },
  {
    value: "peserta",
    label: "Peserta",
    where: { isAdministrator: false, NOT: { membership: activeMember } },
  },
  {
    value: "guru",
    label: "Guru",
    where: { membership: { ...activeMember, role: "GURU" } },
  },
  {
    value: "asesor",
    label: "Asesor",
    where: { membership: { ...activeMember, role: "ASESOR" } },
  },
  {
    value: "trainer",
    label: "Trainer",
    where: { membership: { ...activeMember, role: "TRAINER" } },
  },
  {
    value: "admin",
    label: "Admin Organisasi",
    where: { membership: { ...activeMember, isAdmin: true } },
  },
  {
    value: "administrator",
    label: "Administrator",
    where: { isAdministrator: true },
  },
];

const userSelect = {
  id: true,
  name: true,
  email: true,
  isAdministrator: true,
  status: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  lockedUntil: true,
  accounts: { select: { providerId: true } },
  sessions: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { createdAt: true },
  },
  membership: {
    select: {
      role: true,
      isAdmin: true,
      status: true,
      createdAt: true,
      organization: { select: { id: true, name: true, status: true } },
    },
  },
} satisfies Prisma.UserSelect;

type Row = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function membershipOf(user: Row) {
  const m = user.membership;
  return m &&
    m.status === "ACTIVE" &&
    (m.organization.status === "APPROVED" ||
      m.organization.status === "DISABLED")
    ? m
    : null;
}

function RoleCell({ user }: { user: Row }) {
  if (user.isAdministrator) return <AdminBadge label="Administrator" />;
  const m = membershipOf(user);
  if (!m) return <PesertaBadge />;
  return (
    <span className="flex flex-wrap gap-1.5">
      <RoleBadge role={m.role} />
      {m.isAdmin && <AdminBadge />}
    </span>
  );
}

function StatusBadge({ user }: { user: Row }) {
  if (user.status === "DELETED") return <Badge tone="danger">Dihapus</Badge>;
  if (user.lockedUntil && user.lockedUntil > new Date())
    return <Badge tone="warning">Terkunci</Badge>;
  if (!user.emailVerified)
    return <Badge tone="neutral">Belum verifikasi</Badge>;
  return <Badge tone="success">Aktif</Badge>;
}

export default async function UsersPage({
  searchParams,
}: PageProps<"/admin/pengguna">) {
  await requirePermission("user:manage");
  const params = (await searchParams) as SearchParams;
  const tab = TABS.find((t) => t.value === param(params, "peran")) ?? TABS[0]!;
  const q = param(params, "q");
  const organizationId = param(params, "organisasi");
  const status = param(params, "status");
  const detailId = param(params, "detail");
  const page = pageOf(params);

  const base: Prisma.UserWhereInput = {
    ...(status === "dihapus"
      ? { status: "DELETED" }
      : status === "semua"
        ? {}
        : { status: "ACTIVE" }),
    ...(organizationId && organizationId !== "semua"
      ? { membership: { organizationId, status: "ACTIVE" } }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q.toLowerCase() } },
          ],
        }
      : {}),
  };
  const where: Prisma.UserWhereInput = { AND: [base, tab.where] };

  const [
    counts,
    users,
    total,
    totalUsers,
    peserta,
    members,
    admins,
    organizations,
    detail,
  ] = await Promise.all([
    Promise.all(
      TABS.map((t) => db.user.count({ where: { AND: [base, t.where] } })),
    ),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: userSelect,
    }),
    db.user.count({ where }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { status: "ACTIVE", ...TABS[1]!.where } }),
    db.user.count({ where: { status: "ACTIVE", membership: activeMember } }),
    db.user.count({
      where: {
        status: "ACTIVE",
        membership: { ...activeMember, isAdmin: true },
      },
    }),
    db.organization.findMany({
      where: { status: { in: ["APPROVED", "DISABLED"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    detailId
      ? db.user.findUnique({ where: { id: detailId }, select: userSelect })
      : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengguna"
        description="Pantau semua pengguna Becraft. Peran anggota diatur oleh Admin Organisasi masing-masing."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          tone="primary"
          label="Total pengguna"
          value={formatNumber(totalUsers)}
        />
        <StatCard
          icon={GraduationCapIcon}
          tone="success"
          label="Peserta"
          value={formatNumber(peserta)}
        />
        <StatCard
          icon={UserCheckIcon}
          tone="warning"
          label="Anggota organisasi"
          value={formatNumber(members)}
        />
        <StatCard
          icon={ShieldCheckIcon}
          tone="primary"
          label="Admin organisasi"
          value={formatNumber(admins)}
        />
      </div>
      <SectionCard
        title="Daftar pengguna"
        description="Hanya-baca. Administrator tidak mengubah peran anggota organisasi."
      >
        <FilterBar
          className="px-4 pb-4 sm:px-5"
          search={
            <SearchParamInput
              label="Cari pengguna"
              placeholder="Cari nama atau email…"
            />
          }
        >
          <SearchParamSelect
            name="organisasi"
            label="Organisasi"
            options={[
              { value: "semua", label: "Semua organisasi" },
              ...organizations.map((o) => ({ value: o.id, label: o.name })),
            ]}
          />
          <SearchParamSelect
            name="status"
            label="Status akun"
            options={[
              { value: "aktif", label: "Akun aktif" },
              { value: "dihapus", label: "Akun dihapus" },
              { value: "semua", label: "Semua status" },
            ]}
          />
        </FilterBar>
        <LinkTabs
          label="Peran"
          active={tab.value}
          tabs={TABS.map((t, i) => ({
            value: t.value,
            label: t.label,
            count: counts[i],
            href: hrefWith(PATH, params, {
              peran: t.value === "semua" ? null : t.value,
              page: null,
              detail: null,
            }),
          }))}
        />
        {users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Tidak ada pengguna"
            description="Pengguna yang cocok dengan filter akan tampil di sini."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Organisasi</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead>Terakhir aktif</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <UserRow
                      name={user.name}
                      detail={user.email}
                      className="min-w-56"
                    />
                  </TableCell>
                  <TableCell>
                    <RoleCell user={user} />
                  </TableCell>
                  <TableCell className="min-w-40">
                    {membershipOf(user)?.organization.name ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {user.sessions[0]
                      ? formatRelative(user.sessions[0].createdAt)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge user={user} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={hrefWith(PATH, params, { detail: user.id })}
                      scroll={false}
                      className={buttonVariants({
                        size: "sm",
                        variant: "secondary",
                      })}
                    >
                      Lihat
                    </Link>
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
          noun="pengguna"
          hrefFor={(p) => hrefWith(PATH, params, { page: p })}
        />
      </SectionCard>
      {detail && (
        <DetailSheet>
          <div className="flex flex-col gap-4">
            <UserRow
              name={detail.name}
              detail={detail.email}
              trailing={<StatusBadge user={detail} />}
            />
            <InfoRows
              rows={[
                { label: "Peran", value: <RoleCell user={detail} /> },
                {
                  label: "Organisasi",
                  value: membershipOf(detail)?.organization.name ?? "—",
                },
                {
                  label: "Bergabung organisasi",
                  value: membershipOf(detail)
                    ? formatDate(membershipOf(detail)!.createdAt)
                    : "—",
                },
                {
                  label: "Metode masuk",
                  value: detail.accounts.some((a) => a.providerId === "google")
                    ? "Google"
                    : "Email dan kata sandi",
                },
                {
                  label: "Email terverifikasi",
                  value: detail.emailVerified ? "Ya" : "Belum",
                },
                {
                  label: "Terdaftar",
                  value: `${formatDateTime(detail.createdAt)} WIB`,
                },
                {
                  label: "Terakhir aktif",
                  value: detail.sessions[0]
                    ? `${formatDateTime(detail.sessions[0].createdAt)} WIB`
                    : "—",
                },
              ]}
            />
            <Alert tone="info">
              Peran anggota diubah oleh Admin Organisasi. Administrator hanya
              dapat melihat data ini.
            </Alert>
          </div>
        </DetailSheet>
      )}
    </div>
  );
}
