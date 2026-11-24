import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  IdCardIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminBadge, RoleBadge } from "@/app/(app)/_components/badges";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { ShareCodeButton } from "@/app/(app)/organisasi/_components/share-code-button";
import { Alert } from "@/components/ui/alert";
import { CopyButton } from "@/components/ui/copy-button";
import { IconBox } from "@/components/ui/icon-box";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { UserRow } from "@/components/ui/user-row";
import { db } from "@/lib/db";
import { daysAgo, formatDate, formatNumber } from "@/lib/format";
import { requireOrganizationAdmin } from "@/lib/organization-access";

export const metadata: Metadata = { title: "Beranda organisasi" };

export default async function OrganizationHomePage() {
  const { user, organizationId } =
    await requireOrganizationAdmin("member:manage");
  const week = daysAgo(7);
  const [
    organization,
    memberCount,
    adminCount,
    joinedWeek,
    activeEvents,
    participants,
    recent,
    pendingTrainer,
  ] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true, code: true, reviewedAt: true },
    }),
    db.membership.count({ where: { organizationId, status: "ACTIVE" } }),
    db.membership.count({
      where: { organizationId, status: "ACTIVE", isAdmin: true },
    }),
    db.membership.count({
      where: { organizationId, status: "ACTIVE", createdAt: { gte: week } },
    }),
    db.event.count({ where: { organizationId, status: "PUBLISHED" } }),
    db.enrollment.count({ where: { event: { organizationId } } }),
    db.membership.findMany({
      where: { organizationId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    db.trainerRequest.count({ where: { organizationId, status: "PENDING" } }),
  ]);
  const recentlyApproved =
    organization.reviewedAt && organization.reviewedAt >= week;
  const firstName = user.name.split(" ")[0];

  const shortcuts = [
    {
      href: "/organisasi/profil",
      icon: IdCardIcon,
      title: "Profil organisasi",
      detail: "Nama, jenis, kontak, dan logo",
    },
    {
      href: "/organisasi/anggota",
      icon: ShieldCheckIcon,
      title: "Anggota & peran",
      detail: "Ubah peran dan jadikan admin",
    },
    {
      href: "/organisasi/anggota?tab=pengajuan",
      icon: BookOpenIcon,
      title: "Pengajuan Trainer",
      detail:
        pendingTrainer > 0
          ? `${pendingTrainer} pengajuan menunggu ditinjau`
          : "Tidak ada pengajuan menunggu",
    },
    {
      href: "/organisasi/profil#kode",
      icon: RotateCcwIcon,
      title: "Buat ulang kode",
      detail: "Jika kode tersebar ke pihak lain",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Selamat datang, ${firstName}`}
        description={`Admin Organisasi · ${organization.name}`}
      />
      {recentlyApproved && (
        <Alert
          tone="success"
          title="Organisasi Anda telah disetujui Administrator"
        >
          Anda kini Admin Organisasi. Bagikan kode di bawah agar guru, asesor,
          atau trainer bisa bergabung.
        </Alert>
      )}
      <section className="flex flex-col gap-5 rounded-2xl bg-primary-500 p-5 text-primary-foreground shadow-sm sm:p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-caption-strong tracking-wider uppercase opacity-80">
            Kode organisasi
          </p>
          <p className="font-mono text-display tracking-widest break-all">
            {organization.code}
          </p>
          <p className="max-w-xl text-small opacity-90">
            Bagikan kode ini ke guru, asesor, atau trainer. Mereka langsung
            menjadi anggota {organization.name} setelah email terverifikasi.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <CopyButton value={organization.code} />
            <ShareCodeButton
              code={organization.code}
              organizationName={organization.name}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-white/10 p-4 lg:min-w-56">
          <p className="text-small opacity-90">Bergabung lewat kode</p>
          <p className="text-h2">{formatNumber(memberCount)} anggota</p>
          <p className="text-small opacity-90">
            {formatNumber(joinedWeek)} dalam 7 hari terakhir
          </p>
        </div>
      </section>
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <SectionCard
          title="Anggota terbaru"
          description="Bergabung memakai kode organisasi."
          bodyClassName="px-4 sm:px-5"
        >
          <ul className="flex flex-col">
            {recent.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-b-0"
              >
                <UserRow
                  name={member.user.name}
                  detail={member.user.email}
                  className="min-w-48 flex-1"
                />
                <span className="flex flex-wrap gap-1.5">
                  <RoleBadge role={member.role} />
                  {member.isAdmin && <AdminBadge />}
                </span>
                <span className="text-small whitespace-nowrap text-muted-foreground">
                  {formatDate(member.createdAt)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/organisasi/anggota"
            className="-mx-4 flex items-center gap-1.5 border-t border-border px-4 py-3.5 text-small-strong text-primary-500 hover:underline sm:-mx-5 sm:px-5"
          >
            Kelola anggota
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </SectionCard>
        <SectionCard title="Kelola organisasi" bodyClassName="px-2 pb-2">
          <ul className="flex flex-col">
            {shortcuts.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted"
                >
                  <IconBox icon={item.icon} tone="primary" size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="text-small text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
