import {
  ArrowRightIcon,
  Building2Icon,
  CalendarIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  ClockIcon,
  PowerIcon,
  RotateCcwIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { orgTypeLabel } from "@/app/(app)/_components/badges";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { applicantSelect, verifiedApplicant } from "@/app/(app)/admin/queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBox } from "@/components/ui/icon-box";
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
import { db } from "@/lib/db";
import {
  daysAgo,
  formatDate,
  formatLongDate,
  formatNumber,
  formatRelative,
  greeting,
  workingDaysSince,
} from "@/lib/format";

export const metadata: Metadata = { title: "Administrator" };

export default async function AdminPage() {
  const user = await requireHomeRole(["ADMINISTRATOR"]);
  const since = daysAgo(30);
  const [
    pendingCount,
    activeOrganizations,
    users,
    activeEvents,
    queue,
    newUsers,
    approved30,
    rejected30,
    published30,
    certificates30,
    recent,
  ] = await Promise.all([
    db.organization.count({
      where: { ...verifiedApplicant, status: "PENDING" },
    }),
    db.organization.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.organization.findMany({
      where: { ...verifiedApplicant, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 3,
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        ...applicantSelect,
      },
    }),
    db.user.count({ where: { createdAt: { gte: since }, status: "ACTIVE" } }),
    db.organization.count({
      where: {
        status: { in: ["APPROVED", "DISABLED"] },
        reviewedAt: { gte: since },
      },
    }),
    db.organization.count({
      where: { status: "REJECTED", reviewedAt: { gte: since } },
    }),
    db.event.count({ where: { publishedAt: { gte: since } } }),
    db.certificate.count({ where: { issuedAt: { gte: since } } }),
    db.organization.findMany({
      where: verifiedApplicant,
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        reviewedAt: true,
      },
    }),
  ]);

  const activity = recent.map((organization) => {
    switch (organization.status) {
      case "APPROVED":
        return {
          icon: CircleCheckIcon,
          tone: "success" as const,
          text: `${organization.name} disetujui`,
        };
      case "REJECTED":
        return {
          icon: RotateCcwIcon,
          tone: "warning" as const,
          text: `Pengajuan ${organization.name} ditolak`,
        };
      case "DISABLED":
        return {
          icon: PowerIcon,
          tone: "danger" as const,
          text: `${organization.name} dinonaktifkan`,
        };
      default:
        return {
          icon: Building2Icon,
          tone: "primary" as const,
          text: `Pengajuan baru dari ${organization.name}`,
        };
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greeting()}, ${user.name}`}
        description={`Ringkasan platform Becraft hari ini, ${formatLongDate(new Date())}.`}
        actions={
          <Link
            href="/admin/persetujuan"
            className={buttonVariants({ variant: "secondary" })}
          >
            <ClipboardCheckIcon aria-hidden="true" />
            Buka antrean persetujuan
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardCheckIcon}
          tone="warning"
          label="Menunggu persetujuan"
          value={formatNumber(pendingCount)}
        />
        <StatCard
          icon={Building2Icon}
          tone="primary"
          label="Organisasi aktif"
          value={formatNumber(activeOrganizations)}
        />
        <StatCard
          icon={UsersIcon}
          tone="primary"
          label="Pengguna terdaftar"
          value={formatNumber(users)}
        />
        <StatCard
          icon={CalendarIcon}
          tone="success"
          label="Acara aktif"
          value={formatNumber(activeEvents)}
        />
      </div>
      <SectionCard
        title="Perlu tindakan"
        description="Pengajuan organisasi terlama ditampilkan lebih dulu. Target peninjauan 1–2 hari kerja."
      >
        {queue.length === 0 ? (
          <EmptyState
            icon={ClipboardCheckIcon}
            title="Belum ada pengajuan"
            description="Pengajuan organisasi baru akan tampil di sini."
            className="border-0"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisasi</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Diajukan</TableHead>
                  <TableHead className="text-center">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((organization) => {
                  const applicant = organization.members[0]?.user;
                  const late = workingDaysSince(organization.createdAt) >= 2;
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
                        <div className="flex min-w-44 flex-col">
                          <span className="text-body-medium">
                            {applicant?.name}
                          </span>
                          <span className="text-small text-muted-foreground">
                            {applicant?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-28 flex-wrap items-center gap-2">
                          {formatDate(organization.createdAt)}
                          {late && (
                            <Badge tone="neutral">
                              <ClockIcon aria-hidden="true" />
                              Lewat 2 hari kerja
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link
                          href={`/admin/persetujuan/${organization.id}`}
                          className={buttonVariants({ size: "sm" })}
                        >
                          Tinjau
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Link
              href="/admin/persetujuan"
              className="flex items-center gap-1.5 border-t border-border px-4 py-3.5 text-small-strong text-primary-500 hover:underline sm:px-5"
            >
              Lihat semua {pendingCount} pengajuan
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          </>
        )}
      </SectionCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Pertumbuhan 30 hari terakhir"
          bodyClassName="px-4 pb-2 sm:px-5"
        >
          <dl className="flex flex-col">
            {[
              ["Pengguna baru", `+${formatNumber(newUsers)}`],
              ["Organisasi disetujui", `+${formatNumber(approved30)}`],
              ["Pengajuan ditolak", formatNumber(rejected30)],
              ["Acara diterbitkan", `+${formatNumber(published30)}`],
              ["Sertifikat terbit", formatNumber(certificates30)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border py-3 last:border-b-0 sm:grid-cols-[10rem_1fr]"
              >
                <dt className="text-small text-muted-foreground">{label}</dt>
                <dd className="text-body-strong text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
        <SectionCard
          title="Aktivitas terbaru"
          bodyClassName="px-4 pb-4 sm:px-5"
        >
          {recent.length === 0 ? (
            <p className="text-small text-muted-foreground">
              Belum ada aktivitas.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {recent.map((organization, index) => (
                <li key={organization.id} className="flex items-start gap-3">
                  <IconBox
                    icon={activity[index]!.icon}
                    tone={activity[index]!.tone}
                    size="sm"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-body-medium text-foreground">
                      {activity[index]!.text}
                    </p>
                    <p className="text-small text-muted-foreground">
                      {formatRelative(
                        organization.reviewedAt ?? organization.updatedAt,
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
