import { ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { roleLabels } from "@/lib/rbac";

import { TrainerRequestCard } from "./_components/trainer-request-card";

export const metadata: Metadata = { title: "Profil" };

export default async function TeacherProfilePage() {
  const user = await requireHomeRole(["GURU", "ASESOR", "TRAINER"]);
  const membership = user.membership!;
  const [detail, request] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        emailVerified: true,
        createdAt: true,
        membership: { select: { createdAt: true } },
      },
    }),
    db.trainerRequest.findFirst({
      where: {
        userId: user.id,
        organizationId: membership.organization.id,
        status: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        plannedMaterial: true,
        rejectionReason: true,
      },
    }),
  ]);
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const role = roleLabels[membership.role];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profil"
        description="Informasi akun, organisasi, dan akses Trainer Anda."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-500 text-h2 text-inverse">
              {initials}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-h1 text-foreground">{user.name}</h2>
                <Badge tone="primary" size="sm">
                  {role}
                </Badge>
              </div>
              <span className="truncate text-small text-muted-foreground">
                {user.email}
              </span>
            </div>
          </section>
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-h2 text-foreground">Informasi umum akun</h2>
            <dl className="flex flex-col divide-y divide-border">
              <div className="flex flex-col gap-1 py-3">
                <dt className="text-caption text-muted-foreground">
                  Nama lengkap
                </dt>
                <dd className="text-body-strong text-foreground">
                  {user.name}
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-3">
                <dt className="flex items-center justify-between gap-2 text-caption text-muted-foreground">
                  Alamat email
                  {detail.emailVerified && (
                    <Badge tone="success" size="sm">
                      <ShieldCheckIcon aria-hidden="true" />
                      Terverifikasi
                    </Badge>
                  )}
                </dt>
                <dd className="text-body-strong break-all text-foreground">
                  {user.email}
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-3">
                <dt className="text-caption text-muted-foreground">Peran</dt>
                <dd className="text-body-strong text-foreground">{role}</dd>
              </div>
            </dl>
          </section>
        </div>
        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-h3 text-foreground">Organisasi</h2>
            <span className="text-body-strong text-foreground">
              {membership.organization.name}
            </span>
            <dl className="flex flex-col gap-2 text-small">
              <div className="flex justify-between gap-2">
                <dt className="text-label">Peran</dt>
                <dd className="text-small-strong">
                  {role}
                  {membership.isAdmin ? " · Admin" : ""}
                </dd>
              </div>
              {detail.membership && (
                <div className="flex justify-between gap-2">
                  <dt className="text-label">Bergabung</dt>
                  <dd className="text-small-strong">
                    {formatDate(detail.membership.createdAt)}
                  </dd>
                </div>
              )}
            </dl>
            {membership.role === "TRAINER" ? (
              <Badge tone="success" size="sm" className="w-fit">
                Akses Trainer aktif
              </Badge>
            ) : (
              <TrainerRequestCard
                organizationName={membership.organization.name}
                request={request}
              />
            )}
            <p className="text-caption text-muted-foreground">
              Satu akun hanya dapat berada di satu organisasi. Peran diatur oleh
              Admin Organisasi.
            </p>
          </section>
          <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-small">
            <h2 className="text-h3 text-foreground">Akun</h2>
            <div className="flex justify-between gap-2">
              <span className="text-label">Bergabung sejak</span>
              <span className="text-small-strong">
                {formatDate(detail.createdAt)}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
