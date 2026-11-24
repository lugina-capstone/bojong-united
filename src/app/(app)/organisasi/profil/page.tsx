import type { Metadata } from "next";

import { AdminBadge, OrgStatusBadge } from "@/app/(app)/_components/badges";
import { InfoRows } from "@/app/(app)/_components/info-rows";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { LeaveOrganizationButton } from "@/app/(app)/organisasi/_components/leave-button";
import { CodeCard } from "@/app/(app)/organisasi/profil/code-card";
import { ProfileForm } from "@/app/(app)/organisasi/profil/profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { UserRow } from "@/components/ui/user-row";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { logoUrlOf, requireOrganizationAdmin } from "@/lib/organization-access";

export const metadata: Metadata = { title: "Profil organisasi" };

export default async function OrganizationProfilePage() {
  const { user, organizationId } = await requireOrganizationAdmin(
    "organization:update",
  );
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: {
      name: true,
      type: true,
      code: true,
      codeCreatedAt: true,
      contactEmail: true,
      contactPhone: true,
      status: true,
      reviewedAt: true,
      logo: { select: { key: true, name: true, contentType: true } },
      members: {
        where: { status: "ACTIVE", isAdmin: true },
        orderBy: { createdAt: "asc" },
        select: { userId: true, user: { select: { name: true, email: true } } },
      },
    },
  });
  const [logoUrl, uses] = await Promise.all([
    logoUrlOf(organization.logo),
    db.membership.count({
      where: { organizationId, createdAt: { gte: organization.codeCreatedAt } },
    }),
  ]);
  const otherAdmin =
    organization.members.find((m) => m.userId !== user.id)?.user.name ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profil organisasi"
        description="Atur identitas organisasi dan kode untuk mengundang anggota."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            title="Data organisasi"
            description="Nama organisasi tampil sebagai penyelenggara di setiap acara."
            bodyClassName="gap-4 px-4 pb-5 sm:px-5"
          >
            <ProfileForm
              key={`${organization.name}-${organization.type}-${organization.contactEmail}-${organization.contactPhone}`}
              logoUrl={logoUrl}
              initial={{
                name: organization.name,
                type: organization.type,
                contactEmail: organization.contactEmail ?? "",
                contactPhone: organization.contactPhone ?? "",
              }}
            />
            <InfoRows
              className="border-t border-border"
              rows={[
                {
                  label: "Status",
                  value: <OrgStatusBadge status={organization.status} />,
                },
                {
                  label: "Disetujui",
                  value: organization.reviewedAt
                    ? `${formatDate(organization.reviewedAt)} oleh Administrator`
                    : "—",
                },
              ]}
            />
          </SectionCard>
          <SectionCard
            title="Admin organisasi"
            description="Organisasi minimal punya 1 admin."
            bodyClassName="gap-3 px-4 pb-5 sm:px-5"
          >
            <ul className="flex flex-col">
              {organization.members.map((admin) => (
                <li
                  key={admin.userId}
                  className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <UserRow
                    name={`${admin.user.name}${admin.userId === user.id ? " (Anda)" : ""}`}
                    detail={admin.user.email}
                    className="flex-1"
                    trailing={<AdminBadge />}
                  />
                </li>
              ))}
            </ul>
            <LeaveOrganizationButton
              organizationName={organization.name}
              otherAdmin={otherAdmin}
            />
          </SectionCard>
        </div>
        <div className="min-w-0">
          <CodeCard
            code={organization.code}
            organizationName={organization.name}
            createdAt={formatDate(organization.codeCreatedAt)}
            uses={uses}
          />
        </div>
      </div>
    </div>
  );
}
