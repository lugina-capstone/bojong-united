import {
  CircleAlertIcon,
  CircleCheckIcon,
  MailCheckIcon,
  SendIcon,
  UserPlusIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrgStatusBadge, OrgTypeBadge } from "@/app/(app)/_components/badges";
import { InfoRows } from "@/app/(app)/_components/info-rows";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { ReviewActions } from "@/app/(app)/admin/persetujuan/[id]/review-actions";
import { applicantSelect } from "@/app/(app)/admin/queries";
import { Badge } from "@/components/ui/badge";
import { IconBox } from "@/components/ui/icon-box";
import { OrgLogo } from "@/components/ui/org-logo";
import { UserRow } from "@/components/ui/user-row";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { logoUrlOf } from "@/lib/organization-access";
import { requirePermission } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail pengajuan" };

const STATUS_LABEL = {
  PENDING: "Menunggu persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  DISABLED: "Nonaktif",
} as const;

function Check({
  ok,
  title,
  detail,
}: {
  ok: boolean;
  title: string;
  detail: string;
}) {
  const Icon = ok ? CircleCheckIcon : CircleAlertIcon;
  return (
    <li className="flex gap-2.5">
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4.5 shrink-0",
          ok ? "text-success-600" : "text-warning-700",
        )}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-body-medium text-foreground">{title}</p>
        <p className="text-small text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

export default async function ApprovalDetailPage({
  params,
}: PageProps<"/admin/persetujuan/[id]">) {
  await requirePermission("organization:review");
  const { id } = await params;
  const organization = await db.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      code: true,
      status: true,
      contactEmail: true,
      contactPhone: true,
      rejectionReason: true,
      createdAt: true,
      applicationNumber: true,
      reviewedAt: true,
      reviewedBy: { select: { name: true } },
      logo: { select: { key: true, name: true, contentType: true } },
      ...applicantSelect,
    },
  });
  const applicantMember = organization?.members[0];
  if (!organization || !applicantMember) notFound();
  const applicant = applicantMember.user;
  // Pengajuan dari email yang belum terverifikasi tidak masuk antrean.
  if (!applicant.emailVerified) notFound();

  const [duplicates, logoUrl] = await Promise.all([
    db.organization.count({
      where: {
        id: { not: organization.id },
        name: { equals: organization.name.trim(), mode: "insensitive" },
        status: { in: ["PENDING", "APPROVED", "DISABLED"] },
      },
    }),
    logoUrlOf(organization.logo),
  ]);
  const domain = applicant.email.split("@")[1] ?? "";
  const viaGoogle = applicant.accounts.some((a) => a.providerId === "google");
  const isPending = organization.status === "PENDING";

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-small text-muted-foreground">
        <Link href="/admin/persetujuan" className="hover:text-foreground">
          Persetujuan organisasi
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground">{organization.name}</span>
      </nav>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
              <OrgStatusBadge
                status={organization.status}
                label={STATUS_LABEL[organization.status]}
              />
            </div>
            <p className="text-small text-muted-foreground">
              Pengajuan #ORG-{organization.createdAt.getFullYear()}-
              {String(organization.applicationNumber).padStart(4, "0")} ·
              Diajukan {formatDateTime(organization.createdAt)} WIB
            </p>
          </div>
        </div>
        {isPending && (
          <div className="flex flex-wrap gap-2">
            <ReviewActions
              organizationId={organization.id}
              organizationName={organization.name}
              applicantName={applicant.name}
              applicantEmail={applicant.email}
              code={organization.code}
            />
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            title="Data organisasi"
            bodyClassName="px-4 pb-2 sm:px-5"
          >
            <InfoRows
              rows={[
                { label: "Nama organisasi", value: organization.name },
                {
                  label: "Jenis organisasi",
                  value: <OrgTypeBadge type={organization.type} />,
                },
                { label: "Domain email pemohon", value: domain },
                {
                  label: "Kontak",
                  value:
                    [organization.contactEmail, organization.contactPhone]
                      .filter(Boolean)
                      .join(" · ") || "—",
                },
                {
                  label: "Kode organisasi",
                  value: isPending ? (
                    <span className="text-muted-foreground">
                      Aktif setelah disetujui
                    </span>
                  ) : (
                    <span className="font-mono">{organization.code}</span>
                  ),
                },
              ]}
            />
          </SectionCard>
          <SectionCard
            title="Data pemohon"
            bodyClassName="gap-2 px-4 pb-2 sm:px-5"
          >
            <UserRow
              name={applicant.name}
              detail={applicant.email}
              trailing={
                <Badge tone="success">
                  <CircleCheckIcon aria-hidden="true" />
                  Email terverifikasi
                </Badge>
              }
            />
            <InfoRows
              rows={[
                { label: "Peran setelah disetujui", value: "Admin Organisasi" },
                {
                  label: "Metode pendaftaran",
                  value: viaGoogle ? "Google" : "Formulir manual",
                },
                {
                  label: "Akun dibuat",
                  value: `${formatDateTime(applicant.createdAt)} WIB`,
                },
              ]}
            />
          </SectionCard>
          <SectionCard
            title="Riwayat pengajuan"
            bodyClassName="px-4 pb-4 sm:px-5"
          >
            <ol className="flex flex-col gap-4">
              {[
                ...(organization.reviewedAt
                  ? [
                      {
                        icon:
                          organization.status === "REJECTED"
                            ? CircleAlertIcon
                            : CircleCheckIcon,
                        title:
                          organization.status === "REJECTED"
                            ? `Ditolak oleh ${organization.reviewedBy?.name ?? "Administrator"}`
                            : `Disetujui oleh ${organization.reviewedBy?.name ?? "Administrator"}`,
                        date: organization.reviewedAt,
                      },
                    ]
                  : []),
                {
                  icon: SendIcon,
                  title: "Pengajuan dikirim ke Administrator",
                  date: organization.createdAt,
                },
                {
                  icon: MailCheckIcon,
                  title: "Email pemohon terverifikasi",
                  date: null,
                },
                {
                  icon: UserPlusIcon,
                  title: "Akun pemohon dibuat",
                  date: applicant.createdAt,
                },
              ].map((step) => (
                <li key={step.title} className="flex items-start gap-3">
                  <IconBox icon={step.icon} tone="neutral" size="sm" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-body-medium text-foreground">
                      {step.title}
                    </p>
                    {step.date && (
                      <p className="text-small text-muted-foreground">
                        {formatDateTime(step.date)} WIB
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            title="Pemeriksaan"
            description="Cek otomatis membantu, keputusan tetap di Administrator."
            bodyClassName="px-4 pb-4 sm:px-5"
          >
            <ul className="flex flex-col gap-4">
              <Check
                ok
                title="Email pemohon terverifikasi"
                detail={`${applicant.email} sudah memasukkan kode verifikasi.`}
              />
              <Check
                ok={duplicates === 0}
                title={
                  duplicates === 0
                    ? "Belum ada organisasi serupa"
                    : "Nama organisasi sudah terdaftar"
                }
                detail={
                  duplicates === 0
                    ? "Tidak ditemukan organisasi dengan nama yang sama."
                    : `Ada ${duplicates} organisasi lain dengan nama yang sama.`
                }
              />
              <Check
                ok={false}
                title="Nama resmi organisasi"
                detail="Periksa manual sesuai data resmi."
              />
            </ul>
          </SectionCard>
          {organization.status === "REJECTED" &&
          organization.rejectionReason ? (
            <SectionCard
              title="Alasan penolakan"
              bodyClassName="px-4 pb-4 sm:px-5"
            >
              <p className="text-body text-label">
                {organization.rejectionReason}
              </p>
              {organization.reviewedAt && (
                <p className="mt-2 text-small text-muted-foreground">
                  Ditolak {formatDate(organization.reviewedAt)}
                </p>
              )}
            </SectionCard>
          ) : (
            <SectionCard
              title="Setelah keputusan"
              bodyClassName="gap-3 px-4 pb-4 sm:px-5"
            >
              <div className="flex flex-col gap-1.5">
                <Badge tone="success">
                  <CircleCheckIcon aria-hidden="true" />
                  Disetujui
                </Badge>
                <p className="text-small text-label">
                  Pemohon menjadi Admin Organisasi, kode organisasi aktif, dan
                  email persetujuan dikirim.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Badge tone="danger">
                  <CircleAlertIcon aria-hidden="true" />
                  Ditolak
                </Badge>
                <p className="text-small text-label">
                  Alasan dikirim lewat email. Pemohon dapat memperbaiki data
                  lalu mengajukan ulang.
                </p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
