"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import type { MemberRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { notify, notifyOrganizationAdmins } from "@/lib/notifications";
import { requireOrganizationAdmin } from "@/lib/organization-access";
import { generateOrganizationCode } from "@/lib/organization-code";
import { sendNoticeEmail } from "@/lib/organization-email";
import {
  canDemoteAdmin,
  canLeaveOrganization,
  canPromoteAdmin,
  canRegenerateCode,
  canRemoveMember,
  sniffImageType,
} from "@/lib/organization-rules";
import { roleLabels } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { deleteObject, readObjectHead } from "@/lib/storage";
import { logoContentTypes, MAX_LOGO_SIZE } from "@/lib/validations/auth";
import {
  memberRoleSchema,
  organizationProfileSchema,
  trainerRejectionSchema,
} from "@/lib/validations/organization";

export type OrgActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  code?: string;
};

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

class RuleError extends Error {}

/** Jalankan transaksi aturan admin; konflik serialisasi/aturan dikembalikan sebagai pesan. */
async function guarded(run: () => Promise<void>): Promise<OrgActionState> {
  try {
    await run();
    return { ok: true };
  } catch (error) {
    if (error instanceof RuleError) return { error: error.message };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    )
      return { error: "Data sedang diubah admin lain. Coba lagi." };
    throw error;
  }
}

function activeMemberOf(organizationId: string, membershipId: string) {
  return db.membership.findFirst({
    where: { id: membershipId, organizationId, status: "ACTIVE" },
    select: {
      id: true,
      userId: true,
      role: true,
      isAdmin: true,
      user: { select: { name: true, email: true } },
      organization: { select: { name: true } },
    },
  });
}

export async function updateOrganizationProfileAction(
  input: unknown,
): Promise<OrgActionState> {
  const { organizationId } = await requireOrganizationAdmin(
    "organization:update",
  );
  const parsed = organizationProfileSchema.safeParse(input);
  if (!parsed.success)
    return {
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  await db.organization.update({
    where: { id: organizationId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone?.trim() || null,
    },
  });
  refresh();
  return { ok: true };
}

/** Pasang (fileId) atau hapus (null) logo organisasi. Berkas lama dihapus dari storage. */
export async function updateOrganizationLogoAction(
  fileId: string | null,
): Promise<OrgActionState> {
  const { user, organizationId } = await requireOrganizationAdmin(
    "organization:update",
  );
  if (fileId) {
    const file = await db.file.findFirst({
      where: { id: fileId, ownerId: user.id, status: "UPLOADED" },
      select: { key: true, size: true, contentType: true },
    });
    const valid =
      file &&
      file.size <= MAX_LOGO_SIZE &&
      (logoContentTypes as readonly string[]).includes(file.contentType) &&
      sniffImageType(await readObjectHead(file.key, 8)) === file.contentType;
    if (!valid) return { error: "Logo harus PNG/JPG, maks. 2 MB." };
  }
  const previous = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { logo: { select: { id: true, key: true } } },
  });
  await db.organization.update({
    where: { id: organizationId },
    data: { logoFileId: fileId },
  });
  if (previous.logo && previous.logo.id !== fileId) {
    await db.file.delete({ where: { id: previous.logo.id } });
    await deleteObject(previous.logo.key).catch(() => undefined);
  }
  refresh();
  return { ok: true };
}

/** Buat ulang kode: kode lama langsung tidak berlaku, anggota tetap aktif. */
export async function regenerateOrganizationCodeAction(): Promise<OrgActionState> {
  const { organizationId } = await requireOrganizationAdmin(
    "organization:update",
  );
  const { codeCreatedAt } = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { codeCreatedAt: true },
  });
  const rule = canRegenerateCode(codeCreatedAt, new Date());
  if (!rule.allowed) return { error: rule.reason };
  for (let attempt = 0; ; attempt++) {
    const code = generateOrganizationCode();
    try {
      // Syarat `codeCreatedAt` menolak permintaan kedua yang datang bersamaan.
      const updated = await db.organization.updateMany({
        where: { id: organizationId, codeCreatedAt },
        data: { code, codeCreatedAt: new Date() },
      });
      if (updated.count === 0)
        return { error: "Kode baru saja dibuat. Muat ulang halaman." };
      refresh();
      return { ok: true, code };
    } catch (error) {
      const clash =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 3;
      if (!clash) throw error;
    }
  }
}

export async function changeMemberRoleAction(
  membershipId: string,
  role: MemberRole,
): Promise<OrgActionState> {
  const { user, organizationId } =
    await requireOrganizationAdmin("member:manage");
  const parsed = memberRoleSchema.safeParse(role);
  if (!parsed.success) return { error: "Peran tidak valid." };
  const member = await activeMemberOf(organizationId, membershipId);
  if (!member) return { error: "Anggota tidak ditemukan." };
  if (member.role === parsed.data) return { ok: true };
  const result = await guarded(() =>
    db.$transaction(async (tx) => {
      const changed = await tx.membership.updateMany({
        where: {
          id: member.id,
          organizationId,
          status: "ACTIVE",
          role: member.role,
        },
        data: { role: parsed.data },
      });
      if (changed.count === 0)
        throw new RuleError("Peran anggota sudah diubah. Muat ulang halaman.");
      if (member.role === "TRAINER")
        await releaseMaterials(tx, organizationId, member.userId, false);
      if (parsed.data === "TRAINER")
        await tx.trainerRequest.updateMany({
          where: { userId: member.userId, organizationId, status: "PENDING" },
          data: {
            status: "APPROVED",
            reviewedById: user.id,
            reviewedAt: new Date(),
          },
        });
    }, SERIALIZABLE),
  );
  if (!result.ok) return result;
  await notify([member.userId], "member.role-changed", {
    organizationId,
    organizationName: member.organization.name,
    role: roleLabels[parsed.data],
  });
  refresh();
  return { ok: true };
}

/** Jadikan admin / turunkan admin. Organisasi selalu menyisakan minimal satu admin aktif. */
export async function setMemberAdminAction(
  membershipId: string,
  isAdmin: boolean,
): Promise<OrgActionState> {
  const { organizationId } = await requireOrganizationAdmin("member:manage");
  let target: Awaited<ReturnType<typeof activeMemberOf>> = null;
  const result = await guarded(() =>
    db.$transaction(async (tx) => {
      target = await tx.membership.findFirst({
        where: { id: membershipId, organizationId, status: "ACTIVE" },
        select: {
          id: true,
          userId: true,
          role: true,
          isAdmin: true,
          user: { select: { name: true, email: true } },
          organization: { select: { name: true } },
        },
      });
      if (!target) throw new RuleError("Anggota tidak ditemukan.");
      const adminCount = await tx.membership.count({
        where: { organizationId, status: "ACTIVE", isAdmin: true },
      });
      const rule = isAdmin
        ? canPromoteAdmin(target)
        : canDemoteAdmin(target, adminCount);
      if (!rule.allowed) throw new RuleError(rule.reason);
      await tx.membership.update({
        where: { id: target.id },
        data: { isAdmin },
      });
    }, SERIALIZABLE),
  );
  const member = target as Awaited<ReturnType<typeof activeMemberOf>>;
  if (result.ok && member) {
    await notify(
      [member.userId],
      isAdmin ? "member.admin-granted" : "member.admin-revoked",
      { organizationId, organizationName: member.organization.name },
    );
    refresh();
  }
  return result;
}

/** Pindahkan acara milik anggota yang keluar/dikeluarkan ke admin penerima. */
async function transferEvents(
  tx: Prisma.TransactionClient,
  organizationId: string,
  fromUserId: string,
  toUserId: string,
) {
  const events = await tx.event.findMany({
    where: { organizationId, creatorId: fromUserId },
    select: { id: true, title: true },
  });
  if (events.length > 0)
    await tx.event.updateMany({
      where: { id: { in: events.map((event) => event.id) } },
      data: { creatorId: toUserId, transferredFromId: fromUserId },
    });
  return events;
}

/**
 * Materi hanya bisa dikelola Trainer pembuatnya. Saat ia berhenti jadi Trainer,
 * materinya dialihkan ke Trainer aktif lain; jika tidak ada (atau `transfer`
 * mati), materi terbit diarsipkan agar tidak terbit tanpa pengelola.
 */
async function releaseMaterials(
  tx: Prisma.TransactionClient,
  organizationId: string,
  fromUserId: string,
  transfer: boolean,
) {
  const owned = { organizationId, trainerId: fromUserId };
  if ((await tx.material.count({ where: owned })) === 0) return null;
  const receiver = transfer
    ? await tx.membership.findFirst({
        where: {
          organizationId,
          status: "ACTIVE",
          role: "TRAINER",
          userId: { not: fromUserId },
        },
        orderBy: { createdAt: "asc" },
        select: { userId: true },
      })
    : null;
  if (receiver) {
    await tx.material.updateMany({
      where: owned,
      data: { trainerId: receiver.userId },
    });
    return receiver.userId;
  }
  await tx.material.updateMany({
    where: { ...owned, status: "PUBLISHED" },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  return null;
}

function notifyMaterialsTransferred(
  receiverId: string | null,
  organizationId: string,
  userName: string,
) {
  if (!receiverId) return;
  return notify([receiverId], "material.transferred", {
    organizationId,
    userName,
  });
}

/** Keluarkan anggota: akses dicabut, acaranya dialihkan ke admin yang mengeluarkan. */
export async function removeMemberAction(
  membershipId: string,
): Promise<OrgActionState> {
  const { user, organizationId } =
    await requireOrganizationAdmin("member:manage");
  const member = await activeMemberOf(organizationId, membershipId);
  if (!member) return { error: "Anggota tidak ditemukan." };
  let transferred: { id: string; title: string }[] = [];
  let materialReceiverId: string | null = null;
  const result = await guarded(() =>
    db.$transaction(async (tx) => {
      const current = await tx.membership.findFirst({
        where: { id: membershipId, organizationId, status: "ACTIVE" },
        select: { userId: true, isAdmin: true },
      });
      if (!current) throw new RuleError("Anggota tidak ditemukan.");
      const rule = canRemoveMember(current, user.id);
      if (!rule.allowed) throw new RuleError(rule.reason);
      await tx.membership.update({
        where: { id: membershipId },
        data: { status: "REMOVED", removedAt: new Date() },
      });
      await tx.trainerRequest.deleteMany({
        where: { userId: current.userId, status: "PENDING" },
      });
      transferred = await transferEvents(
        tx,
        organizationId,
        current.userId,
        user.id,
      );
      materialReceiverId = await releaseMaterials(
        tx,
        organizationId,
        current.userId,
        true,
      );
    }, SERIALIZABLE),
  );
  if (!result.ok) return result;
  await notifyMaterialsTransferred(
    materialReceiverId,
    organizationId,
    member.user.name,
  );
  await Promise.all(
    transferred.map((event) =>
      notify([user.id], "event.transferred", {
        organizationId,
        eventId: event.id,
        eventTitle: event.title,
        userName: member.user.name,
      }),
    ),
  );
  await sendNoticeEmail({
    to: member.user.email,
    subject: `Anda dikeluarkan dari ${member.organization.name}`,
    paragraphs: [
      `Halo ${member.user.name},`,
      `Admin organisasi ${member.organization.name} telah mengeluarkan Anda dari organisasi.`,
      "Akun Becraft Anda tetap aktif. Anda dapat membuat organisasi baru, bergabung dengan kode lain, atau melanjutkan sebagai Peserta.",
    ],
    link: { label: "Masuk ke Becraft", path: "/masuk" },
  });
  refresh();
  return { ok: true };
}

export async function reviewTrainerRequestAction(
  requestId: string,
  decision: "approve" | "reject",
  reason?: string,
): Promise<OrgActionState> {
  const { user, organizationId } = await requireOrganizationAdmin(
    "trainer-request:review",
  );
  const parsedReason =
    decision === "reject" ? trainerRejectionSchema.safeParse(reason) : null;
  if (parsedReason && !parsedReason.success)
    return { error: parsedReason.error.issues[0]?.message };
  const request = await db.trainerRequest.findFirst({
    where: { id: requestId, organizationId, status: "PENDING" },
    select: {
      id: true,
      userId: true,
      user: { select: { name: true, email: true } },
      organization: { select: { name: true } },
    },
  });
  if (!request) return { error: "Pengajuan sudah ditinjau." };
  const member = await db.membership.findFirst({
    where: { userId: request.userId, organizationId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!member) return { error: "Pemohon bukan anggota aktif organisasi." };
  const approved = decision === "approve";
  const result = await guarded(() =>
    db.$transaction(async (tx) => {
      const reviewed = await tx.trainerRequest.updateMany({
        where: { id: request.id, organizationId, status: "PENDING" },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          rejectionReason: parsedReason?.data ?? null,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });
      if (reviewed.count === 0)
        throw new RuleError("Pengajuan sudah ditinjau.");
      if (!approved) return;
      const promoted = await tx.membership.updateMany({
        where: { id: member.id, organizationId, status: "ACTIVE" },
        data: { role: "TRAINER" },
      });
      if (promoted.count === 0)
        throw new RuleError("Pemohon bukan anggota aktif organisasi.");
    }, SERIALIZABLE),
  );
  if (!result.ok) return result;
  await notify(
    [request.userId],
    approved ? "trainer-request.approved" : "trainer-request.rejected",
    {
      organizationId,
      organizationName: request.organization.name,
      reason: parsedReason?.data,
    },
  );
  await sendNoticeEmail({
    to: request.user.email,
    subject: approved
      ? "Pengajuan Trainer disetujui"
      : "Pengajuan Trainer belum disetujui",
    paragraphs: approved
      ? [
          `Halo ${request.user.name},`,
          `Pengajuan Anda menjadi Trainer di ${request.organization.name} telah disetujui. Menu Materi kini tersedia di ruang kerja Anda.`,
        ]
      : [
          `Halo ${request.user.name},`,
          `Pengajuan Anda menjadi Trainer di ${request.organization.name} belum dapat disetujui.`,
          `Alasan: ${parsedReason?.data}`,
        ],
    link: { label: "Buka ruang kerja", path: "/ruang-kerja" },
  });
  refresh();
  return { ok: true };
}

/** Anggota keluar dari organisasi. Admin terakhir ditolak; acaranya dialihkan ke admin lain. */
export async function leaveOrganizationAction(): Promise<OrgActionState> {
  const user = await requireUser();
  let transferred: { id: string; title: string }[] = [];
  let receiverId: string | null = null;
  let materialReceiverId: string | null = null;
  let organizationId = "";
  const result = await guarded(() =>
    db.$transaction(async (tx) => {
      const membership = await tx.membership.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
        select: { id: true, isAdmin: true, organizationId: true },
      });
      if (!membership)
        throw new RuleError("Anda tidak tergabung di organisasi.");
      organizationId = membership.organizationId;
      const admins = await tx.membership.findMany({
        where: { organizationId, status: "ACTIVE", isAdmin: true },
        orderBy: { createdAt: "asc" },
        select: { userId: true },
      });
      const rule = canLeaveOrganization(membership, admins.length);
      if (!rule.allowed) throw new RuleError(rule.reason);
      await tx.membership.update({
        where: { id: membership.id },
        data: {
          status: "REMOVED",
          removedAt: new Date(),
          isAdmin: false,
          leftVoluntarily: true,
        },
      });
      await tx.trainerRequest.deleteMany({
        where: { userId: user.id, status: "PENDING" },
      });
      receiverId = admins.find((a) => a.userId !== user.id)?.userId ?? null;
      if (receiverId)
        transferred = await transferEvents(
          tx,
          organizationId,
          user.id,
          receiverId,
        );
      materialReceiverId = await releaseMaterials(
        tx,
        organizationId,
        user.id,
        true,
      );
    }, SERIALIZABLE),
  );
  if (!result.ok) return result;
  await notifyMaterialsTransferred(
    materialReceiverId,
    organizationId,
    user.name,
  );
  if (receiverId)
    await Promise.all(
      transferred.map((event) =>
        notify([receiverId!], "event.transferred", {
          organizationId,
          eventId: event.id,
          eventTitle: event.title,
          userName: user.name,
        }),
      ),
    );
  await notifyOrganizationAdmins(organizationId, "member.left", {
    organizationId,
    userName: user.name,
  });
  redirect("/dikeluarkan");
}

/** Alihkan pengelola acara ke anggota aktif lain di organisasi. */
export async function transferEventAction(
  eventId: string,
  membershipId: string,
): Promise<OrgActionState> {
  const { organizationId } = await requireOrganizationAdmin("member:manage");
  const receiver = await activeMemberOf(organizationId, membershipId);
  if (!receiver) return { error: "Anggota tidak ditemukan." };
  const event = await db.event.findFirst({
    where: { id: eventId, organizationId, status: { not: "DRAFT" } },
    select: { id: true, title: true, creatorId: true },
  });
  if (!event) return { error: "Acara tidak ditemukan." };
  if (event.creatorId === receiver.userId)
    return {
      error: `${receiver.user.name} sudah menjadi pengelola acara ini.`,
    };
  const result = await guarded(() =>
    db.$transaction(async (tx) => {
      const stillActive = await tx.membership.count({
        where: { id: receiver.id, organizationId, status: "ACTIVE" },
      });
      if (stillActive === 0) throw new RuleError("Anggota tidak ditemukan.");
      const moved = await tx.event.updateMany({
        where: { id: event.id, organizationId, creatorId: event.creatorId },
        data: {
          creatorId: receiver.userId,
          transferredFromId: event.creatorId,
        },
      });
      if (moved.count === 0)
        throw new RuleError(
          "Pengelola acara sudah berubah. Muat ulang halaman.",
        );
    }, SERIALIZABLE),
  );
  if (!result.ok) return result;
  const previous = await db.user.findUnique({
    where: { id: event.creatorId },
    select: { name: true },
  });
  await notify([receiver.userId], "event.transferred", {
    organizationId,
    eventId: event.id,
    eventTitle: event.title,
    userName: previous?.name,
  });
  refresh();
  return { ok: true };
}
