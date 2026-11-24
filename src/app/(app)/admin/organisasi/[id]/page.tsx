import {
  ArrowRightIcon,
  CalendarIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminBadge,
  OrgStatusBadge,
  orgTypeLabel,
} from "@/app/(app)/_components/badges";
import { InfoRows } from "@/app/(app)/_components/info-rows";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { OrganizationStatusCard } from "@/app/(app)/admin/organisasi/[id]/status-actions";
import { applicantSelect } from "@/app/(app)/admin/queries";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { OrgLogo } from "@/components/ui/org-logo";
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
import { db } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { logoUrlOf } from "@/lib/organization-access";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Detail organisasi" };

export default async function OrganizationDetailPage({
  params,
}: PageProps<"/admin/organisasi/[id]">) {
  await requirePermission("organization:manage");
  const { id } = await params;
  const organization = await db.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      code: true,
      status: true,
      reviewedAt: true,
      deactivatedAt: true,
      deactivationReason: true,
      reviewedBy: { select: { name: true } },
      logo: { select: { key: true, name: true, contentType: true } },
      ...applicantSelect,
    },
  });
  if (
    !organization ||
    (organization.status !== "APPROVED" && organization.status !== "DISABLED")
  )
    notFound();

  const [
    members,
    memberCount,
    adminCount,
    activeEvents,
    participants,
    logoUrl,
  ] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: id, status: "ACTIVE" },
      orderBy: [{ isAdmin: "desc" }, { createdAt: "asc" }],
      take: 5,
      select: {
        id: true,
        isAdmin: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    db.membership.count({ where: { organizationId: id, status: "ACTIVE" } }),
    db.membership.count({
      where: { organizationId: id, status: "ACTIVE", isAdmin: true },
    }),
    db.event.count({ where: { organizationId: id, status: "PUBLISHED" } }),
    db.enrollment.count({ where: { event: { organizationId: id } } }),
    logoUrlOf(organization.logo),
  ]);
  const disabled = organization.status === "DISABLED";

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-small text-muted-foreground">
        <Link href="/admin/organisasi" className="hover:text-foreground">
          Organisasi
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground">{organization.name}</span>
      </nav>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <OrgLogo
            name={organization.name}
            src={logoUrl}
            className="size-12 rounded-xl"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-display text-foreground">
                {organization.name}
              </h1>
              <OrgStatusBadge status={organization.status} />
            </div>
            <p className="text-small text-muted-foreground">
              {orgTypeLabel(organization.type)}
              {organization.reviewedAt &&
                ` · Disetujui ${formatDate(organization.reviewedAt)} oleh ${organization.reviewedBy?.name ?? "Administrator"}`}
            </p>
          </div>
        </div>
        <CopyButton value={organization.code} />
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          tone="primary"
          label="Anggota"
          value={formatNumber(memberCount)}
        />
        <StatCard
          icon={ShieldCheckIcon}
          tone="primary"
          label="Admin"
          value={formatNumber(adminCount)}
        />
        <StatCard
          icon={CalendarIcon}
          tone="warning"
          label="Acara aktif"
          value={formatNumber(activeEvents)}
        />
        <StatCard
          icon={GraduationCapIcon}
          tone="success"
          label="Peserta terlibat"
          value={formatNumber(participants)}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <SectionCard
          title="Anggota organisasi"
          description="Peran anggota dikelola oleh Admin Organisasi."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Bergabung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <UserRow
                      name={member.user.name}
                      detail={member.user.email}
                      className="min-w-52"
                    />
                  </TableCell>
                  <TableCell>
                    {member.isAdmin ? (
                      <AdminBadge />
                    ) : (
                      <Badge tone="neutral">Anggota</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {memberCount > members.length && (
            <Link
              href={`/admin/pengguna?organisasi=${organization.id}`}
              className="flex items-center gap-1.5 border-t border-border px-4 py-3.5 text-small-strong text-primary-500 hover:underline sm:px-5"
            >
              Lihat semua {memberCount} anggota
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          )}
        </SectionCard>
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            title="Info organisasi"
            bodyClassName="px-4 pb-2 sm:px-5"
          >
            <InfoRows
              rows={[
                {
                  label: "Kode organisasi",
                  value: (
                    <span className="flex items-center gap-1">
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-small-strong text-label">
                        {organization.code}
                      </span>
                      <CopyButton
                        value={organization.code}
                        iconOnly
                        size="icon-sm"
                        variant="ghost"
                      />
                    </span>
                  ),
                },
                { label: "Jenis", value: orgTypeLabel(organization.type) },
                {
                  label: "Diajukan oleh",
                  value: organization.members[0]?.user.name ?? "—",
                },
                {
                  label: "Disetujui",
                  value: organization.reviewedAt
                    ? formatDate(organization.reviewedAt)
                    : "—",
                },
              ]}
            />
          </SectionCard>
          <OrganizationStatusCard
            organizationId={organization.id}
            organizationName={organization.name}
            disabled={disabled}
            deactivatedAt={
              organization.deactivatedAt
                ? formatDate(organization.deactivatedAt)
                : null
            }
            reason={organization.deactivationReason}
            memberCount={memberCount}
            adminCount={adminCount}
            activeEventCount={activeEvents}
          />
        </div>
      </div>
    </div>
  );
}
