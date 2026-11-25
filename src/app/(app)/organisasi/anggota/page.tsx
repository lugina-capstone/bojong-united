import { BookOpenIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";

import { AdminBadge, RoleBadge } from "@/app/(app)/_components/badges";
import { DetailSheet } from "@/app/(app)/_components/detail-sheet";
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
import { MemberActions } from "@/app/(app)/organisasi/anggota/member-actions";
import { TrainerRequestActions } from "@/app/(app)/organisasi/anggota/trainer-actions";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
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
import { formatDate, formatNumber } from "@/lib/format";
import { requireOrganizationAdmin } from "@/lib/organization-access";
import { roleLabels } from "@/lib/rbac";
import { memberRoles } from "@/lib/validations/organization";

export const metadata: Metadata = { title: "Anggota organisasi" };

const PATH = "/organisasi/anggota";

const TABS: {
  value: string;
  label: string;
  where: Prisma.MembershipWhereInput;
}[] = [
  { value: "semua", label: "Semua", where: {} },
  { value: "admin", label: "Admin", where: { isAdmin: true } },
  { value: "guru", label: "Guru", where: { role: "GURU" } },
  { value: "asesor", label: "Asesor", where: { role: "ASESOR" } },
  { value: "trainer", label: "Trainer", where: { role: "TRAINER" } },
];

const EVENT_STATUS = {
  DRAFT: "Draf",
  PUBLISHED: "Aktif",
  CLOSED: "Selesai",
  ARCHIVED: "Diarsipkan",
} as const;

export default async function MembersPage({
  searchParams,
}: PageProps<"/organisasi/anggota">) {
  const { user, organizationId } =
    await requireOrganizationAdmin("member:manage");
  const params = (await searchParams) as SearchParams;
  const tabValue = param(params, "tab") ?? "semua";
  const tab = TABS.find((t) => t.value === tabValue) ?? TABS[0]!;
  const isRequests = tabValue === "pengajuan";
  const q = param(params, "q");
  const role = param(params, "peran");
  const page = pageOf(params);
  const profileId = param(params, "profil");

  const search: Prisma.UserWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q.toLowerCase() } },
        ],
      }
    : undefined;
  const roleFilter = memberRoles.includes(role as never)
    ? { role: role as (typeof memberRoles)[number] }
    : {};
  const base: Prisma.MembershipWhereInput = {
    organizationId,
    status: "ACTIVE",
    ...roleFilter,
    ...(search ? { user: search } : {}),
  };
  const where: Prisma.MembershipWhereInput = { AND: [base, tab.where] };
  const requestWhere: Prisma.TrainerRequestWhereInput = {
    organizationId,
    status: "PENDING",
    user: {
      membership: { organizationId, status: "ACTIVE", ...roleFilter },
      ...search,
    },
  };

  const [
    organization,
    counts,
    requestCount,
    adminCount,
    members,
    total,
    requests,
    profile,
  ] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true, code: true },
    }),
    Promise.all(
      TABS.map((t) => db.membership.count({ where: { AND: [base, t.where] } })),
    ),
    db.trainerRequest.count({ where: requestWhere }),
    db.membership.count({
      where: { organizationId, status: "ACTIVE", isAdmin: true },
    }),
    isRequests
      ? []
      : db.membership.findMany({
          where,
          orderBy: [{ isAdmin: "desc" }, { createdAt: "asc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            userId: true,
            role: true,
            isAdmin: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
                _count: {
                  select: { createdEvents: { where: { organizationId } } },
                },
              },
            },
          },
        }),
    isRequests
      ? db.trainerRequest.count({ where: requestWhere })
      : db.membership.count({ where }),
    isRequests
      ? db.trainerRequest.findMany({
          where: requestWhere,
          orderBy: { createdAt: "asc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            plannedMaterial: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
                membership: { select: { role: true } },
              },
            },
          },
        })
      : [],
    profileId
      ? db.membership.findFirst({
          where: { id: profileId, organizationId, status: "ACTIVE" },
          select: {
            id: true,
            userId: true,
            role: true,
            isAdmin: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
                accounts: { select: { providerId: true } },
                _count: {
                  select: { createdEvents: { where: { organizationId } } },
                },
                createdEvents: {
                  where: { organizationId, status: { not: "DRAFT" } },
                  orderBy: { createdAt: "desc" },
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    _count: { select: { enrollments: true } },
                  },
                },
              },
            },
          },
        })
      : null,
  ]);

  const tabs = [
    ...TABS.map((t, i) => ({
      value: t.value,
      label: t.label,
      count: counts[i],
      href: hrefWith(PATH, params, {
        tab: t.value === "semua" ? null : t.value,
        page: null,
      }),
    })),
    {
      value: "pengajuan",
      label: "Pengajuan",
      count: requestCount,
      href: hrefWith(PATH, params, { tab: "pengajuan", page: null }),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Anggota organisasi"
        description={`Kelola peran anggota ${organization.name}. Anggota baru bergabung memakai kode organisasi.`}
        actions={
          <CopyButton value={organization.code} label="Salin kode undangan" />
        }
      />
      <SectionCard
        title="Daftar anggota"
        description={
          isRequests
            ? "Pengajuan akses Trainer dari anggota."
            : "Admin organisasi ditampilkan lebih dulu."
        }
      >
        <FilterBar
          className="px-4 pb-4 sm:px-5"
          search={
            <SearchParamInput
              label="Cari anggota"
              placeholder="Cari nama atau email anggota…"
            />
          }
        >
          <SearchParamSelect
            name="peran"
            label="Peran"
            options={[
              { value: "semua", label: "Semua peran" },
              ...memberRoles.map((value) => ({
                value,
                label: roleLabels[value],
              })),
            ]}
          />
        </FilterBar>
        <LinkTabs
          label="Kelompok anggota"
          active={isRequests ? "pengajuan" : tab.value}
          tabs={tabs}
        />
        {isRequests ? (
          requests.length === 0 ? (
            <EmptyState
              icon={BookOpenIcon}
              title="Tidak ada pengajuan"
              description="Pengajuan akses Trainer dari anggota akan tampil di sini."
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Peran sekarang</TableHead>
                  <TableHead>Materi yang akan diunggah</TableHead>
                  <TableHead>Diajukan</TableHead>
                  <TableHead className="text-center">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const current = request.user.membership?.role ?? "GURU";
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <UserRow
                          name={request.user.name}
                          detail={request.user.email}
                          className="min-w-52"
                        />
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={current} />
                      </TableCell>
                      <TableCell className="max-w-72 min-w-56 text-small whitespace-normal text-label">
                        {request.plannedMaterial}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <TrainerRequestActions
                          requestId={request.id}
                          name={request.user.name}
                          currentRole={roleLabels[current]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )
        ) : members.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Tidak ada anggota"
            description="Anggota yang cocok dengan filter akan tampil di sini."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Acara dibuat</TableHead>
                <TableHead className="text-center">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <UserRow
                      name={`${member.user.name}${member.userId === user.id ? " (Anda)" : ""}`}
                      detail={member.user.email}
                      className="min-w-52"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1.5">
                      <RoleBadge role={member.role} />
                      {member.isAdmin && <AdminBadge />}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.createdAt)}
                  </TableCell>
                  <TableCell className="text-body-strong">
                    {formatNumber(member.user._count.createdEvents)}
                  </TableCell>
                  <TableCell className="text-center">
                    <MemberActions
                      organizationName={organization.name}
                      adminCount={adminCount}
                      member={{
                        id: member.id,
                        name: member.user.name,
                        role: member.role,
                        isAdmin: member.isAdmin,
                        isSelf: member.userId === user.id,
                        eventCount: member.user._count.createdEvents,
                      }}
                    />
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
          noun={isRequests ? "pengajuan" : "anggota"}
          hrefFor={(p) => hrefWith(PATH, params, { page: p })}
        />
      </SectionCard>
      {profile && (
        <DetailSheet title="Profil anggota" param="profil">
          <div className="flex flex-col gap-4">
            <UserRow name={profile.user.name} detail={profile.user.email} />
            <InfoRows
              rows={[
                {
                  label: "Peran",
                  value: (
                    <span className="flex flex-wrap gap-1.5">
                      <RoleBadge role={profile.role} />
                      {profile.isAdmin && <AdminBadge />}
                    </span>
                  ),
                },
                {
                  label: "Bergabung",
                  value: `${formatDate(profile.createdAt)} · via kode organisasi`,
                },
                {
                  label: "Metode masuk",
                  value: profile.user.accounts.some(
                    (a) => a.providerId === "google",
                  )
                    ? "Google"
                    : "Email dan kata sandi",
                },
                {
                  label: "Acara dibuat",
                  value: `${profile.user._count.createdEvents} acara (${profile.user.createdEvents.filter((e) => e.status === "PUBLISHED").length} aktif)`,
                },
              ]}
            />
            {profile.user.createdEvents.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-small-strong text-label">Acara terbaru</p>
                {profile.user.createdEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-body-medium">
                        {event.title}
                      </span>
                      <span className="text-small text-muted-foreground">
                        {event._count.enrollments} peserta
                      </span>
                    </div>
                    <Badge
                      tone={
                        event.status === "PUBLISHED" ? "success" : "neutral"
                      }
                    >
                      {EVENT_STATUS[event.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <MemberActions
              variant="buttons"
              organizationName={organization.name}
              adminCount={adminCount}
              member={{
                id: profile.id,
                name: profile.user.name,
                role: profile.role,
                isAdmin: profile.isAdmin,
                isSelf: profile.userId === user.id,
                eventCount: profile.user._count.createdEvents,
              }}
            />
          </div>
        </DetailSheet>
      )}
    </div>
  );
}
