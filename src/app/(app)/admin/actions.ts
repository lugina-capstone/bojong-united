"use server";

import { refresh } from "next/cache";

import { db } from "@/lib/db";
import { notify, organizationAdminIds } from "@/lib/notifications";
import { sendNoticeEmail } from "@/lib/organization-email";
import { requirePermission } from "@/lib/session";
import { organizationReasonSchema } from "@/lib/validations/organization";

export type AdminActionState = { ok?: boolean; error?: string };

async function adminsWithEmail(organizationId: string) {
  return db.membership.findMany({
    where: { organizationId, isAdmin: true, status: "ACTIVE" },
    select: { userId: true, user: { select: { email: true, name: true } } },
  });
}

async function activeMemberIds(organizationId: string) {
  const members = await db.membership.findMany({
    where: { organizationId, status: "ACTIVE" },
    select: { userId: true },
  });
  return members.map((member) => member.userId);
}

/** Setujui pengajuan organisasi (PRD-06): organisasi aktif, pemohon tetap Admin Organisasi. */
export async function approveOrganizationAction(
  organizationId: string,
): Promise<AdminActionState> {
  const user = await requirePermission("organization:review");
  const updated = await db.organization.updateMany({
    where: {
      id: organizationId,
      status: "PENDING",
      members: { some: { isAdmin: true, user: { emailVerified: true } } },
    },
    data: {
      status: "APPROVED",
      rejectionReason: null,
      reviewedById: user.id,
      reviewedAt: new Date(),
      codeCreatedAt: new Date(),
    },
  });
  if (updated.count === 0)
    return { error: "Pengajuan sudah ditinjau atau tidak ditemukan." };
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true, code: true },
  });
  const admins = await adminsWithEmail(organizationId);
  await notify(
    admins.map((admin) => admin.userId),
    "organization.approved",
    { organizationId, organizationName: organization.name },
  );
  await Promise.all(
    admins.map((admin) =>
      sendNoticeEmail({
        to: admin.user.email,
        subject: `Organisasi ${organization.name} disetujui`,
        paragraphs: [
          `Halo ${admin.user.name},`,
          `Pengajuan organisasi ${organization.name} telah disetujui Administrator Becraft. Anda kini Admin Organisasi.`,
          `Kode organisasi: ${organization.code}. Bagikan kode ini ke guru, asesor, atau trainer agar mereka dapat bergabung.`,
        ],
        link: { label: "Masuk ke Becraft", path: "/masuk" },
      }),
    ),
  );
  refresh();
  return { ok: true };
}

/** Tolak pengajuan dengan alasan wajib; pemohon dapat mengajukan ulang. */
export async function rejectOrganizationAction(
  organizationId: string,
  reason: string,
): Promise<AdminActionState> {
  const user = await requirePermission("organization:review");
  const parsed = organizationReasonSchema.safeParse(reason);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const updated = await db.organization.updateMany({
    where: { id: organizationId, status: "PENDING" },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });
  if (updated.count === 0)
    return { error: "Pengajuan sudah ditinjau atau tidak ditemukan." };
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true },
  });
  const admins = await adminsWithEmail(organizationId);
  await notify(
    admins.map((admin) => admin.userId),
    "organization.rejected",
    {
      organizationId,
      organizationName: organization.name,
      reason: parsed.data,
    },
  );
  await Promise.all(
    admins.map((admin) =>
      sendNoticeEmail({
        to: admin.user.email,
        subject: `Pengajuan organisasi ${organization.name} ditolak`,
        paragraphs: [
          `Halo ${admin.user.name},`,
          `Pengajuan organisasi ${organization.name} belum dapat disetujui.`,
          `Alasan: ${parsed.data}`,
          "Anda dapat memperbaiki data lalu mengajukan ulang setelah masuk ke Becraft.",
        ],
        link: { label: "Perbaiki dan ajukan ulang", path: "/masuk" },
      }),
    ),
  );
  refresh();
  return { ok: true };
}

/** Nonaktifkan organisasi: anggota tidak bisa masuk ruang kerja; data tetap tersimpan. */
export async function disableOrganizationAction(
  organizationId: string,
  reason: string,
): Promise<AdminActionState> {
  await requirePermission("organization:manage");
  const parsed = organizationReasonSchema.safeParse(reason);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const updated = await db.organization.updateMany({
    where: { id: organizationId, status: "APPROVED" },
    data: {
      status: "DISABLED",
      deactivatedAt: new Date(),
      deactivationReason: parsed.data,
    },
  });
  if (updated.count === 0)
    return { error: "Organisasi sudah nonaktif atau tidak ditemukan." };
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true },
  });
  await notify(await activeMemberIds(organizationId), "organization.disabled", {
    organizationId,
    organizationName: organization.name,
  });
  const admins = await adminsWithEmail(organizationId);
  await Promise.all(
    admins.map((admin) =>
      sendNoticeEmail({
        to: admin.user.email,
        subject: `Organisasi ${organization.name} dinonaktifkan`,
        paragraphs: [
          `Halo ${admin.user.name},`,
          `Organisasi ${organization.name} dinonaktifkan oleh Administrator Becraft. Anggota tidak dapat masuk ke ruang kerja sampai organisasi diaktifkan kembali.`,
          `Alasan: ${parsed.data}`,
          "Acara, nilai, dan sertifikat tetap tersimpan.",
        ],
      }),
    ),
  );
  refresh();
  return { ok: true };
}

export async function enableOrganizationAction(
  organizationId: string,
): Promise<AdminActionState> {
  await requirePermission("organization:manage");
  const updated = await db.organization.updateMany({
    where: { id: organizationId, status: "DISABLED" },
    data: { status: "APPROVED", deactivatedAt: null, deactivationReason: null },
  });
  if (updated.count === 0)
    return { error: "Organisasi sudah aktif atau tidak ditemukan." };
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true },
  });
  await notify(await activeMemberIds(organizationId), "organization.enabled", {
    organizationId,
    organizationName: organization.name,
  });
  const adminIds = await organizationAdminIds(organizationId);
  const admins = await db.user.findMany({
    where: { id: { in: adminIds } },
    select: { email: true, name: true },
  });
  await Promise.all(
    admins.map((admin) =>
      sendNoticeEmail({
        to: admin.email,
        subject: `Organisasi ${organization.name} aktif kembali`,
        paragraphs: [
          `Halo ${admin.name},`,
          `Organisasi ${organization.name} sudah diaktifkan kembali. Anggota dapat masuk ke ruang kerja seperti biasa.`,
        ],
        link: { label: "Masuk ke Becraft", path: "/masuk" },
      }),
    ),
  );
  refresh();
  return { ok: true };
}
