import "server-only";

import { db } from "@/lib/db";
import {
  describeNotification,
  type NotificationPayload,
  type NotificationTeamInvite,
  type NotificationType,
} from "@/lib/notification-format";

export async function notify(
  userIds: string[],
  type: NotificationType,
  payload: NotificationPayload,
) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await db.notification.createMany({
    data: unique.map((userId) => ({ userId, type, payload })),
  });
}

export async function notifyAdministrators(
  type: NotificationType,
  payload: NotificationPayload,
) {
  const administrators = await db.user.findMany({
    where: { isAdministrator: true, status: "ACTIVE" },
    select: { id: true },
  });
  await notify(
    administrators.map((user) => user.id),
    type,
    payload,
  );
}

/** Admin aktif suatu organisasi, opsional tanpa user tertentu (pelaku aksi). */
export async function organizationAdminIds(
  organizationId: string,
  exceptUserId?: string,
) {
  const admins = await db.membership.findMany({
    where: {
      organizationId,
      isAdmin: true,
      status: "ACTIVE",
      ...(exceptUserId ? { userId: { not: exceptUserId } } : {}),
    },
    select: { userId: true },
  });
  return admins.map((admin) => admin.userId);
}

export async function notifyOrganizationAdmins(
  organizationId: string,
  type: NotificationType,
  payload: NotificationPayload,
  exceptUserId?: string,
) {
  await notify(
    await organizationAdminIds(organizationId, exceptUserId),
    type,
    payload,
  );
}

export type NotificationItem = ReturnType<typeof describeNotification> & {
  id: string;
  createdAt: Date;
  read: boolean;
  teamInvite?: NotificationTeamInvite;
};

/** Notifikasi terbaru untuk panel header. */
export async function notificationsFor(userId: string, take = 8) {
  const now = new Date();
  const [rows, unread, pendingInvites] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.notification.count({ where: { userId, readAt: null } }),
    db.teamInvite.findMany({
      where: {
        inviteeId: userId,
        status: "PENDING",
        team: {
          event: {
            status: "PUBLISHED",
            OR: [{ startsAt: null }, { startsAt: { gt: now } }],
          },
        },
      },
      include: {
        team: {
          include: {
            leader: { select: { name: true } },
            event: {
              select: {
                id: true,
                title: true,
                startsAt: true,
                maxTeamMembers: true,
              },
            },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const inviteById = new Map(pendingInvites.map((inv) => [inv.id, inv]));
  const inviteByEvent = new Map<string, (typeof pendingInvites)[number]>();
  for (const inv of pendingInvites) {
    if (!inviteByEvent.has(inv.team.eventId)) {
      inviteByEvent.set(inv.team.eventId, inv);
    }
  }
  const usedInviteIds = new Set<string>();

  const toTeamInvite = (
    inv: (typeof pendingInvites)[number],
    inviterOverride?: string,
  ): NotificationTeamInvite => ({
    inviteId: inv.id,
    eventId: inv.team.event.id,
    eventTitle: inv.team.event.title,
    teamName: inv.team.name,
    inviterName: inviterOverride ?? inv.team.leader.name,
    memberCount: inv.team._count.members,
    maxTeamMembers: inv.team.event.maxTeamMembers ?? 1,
    startsAt: inv.team.event.startsAt?.toISOString() ?? null,
  });

  const dbItems: NotificationItem[] = rows.map((row) => {
    const payload = row.payload as NotificationPayload;
    let teamInvite: NotificationTeamInvite | undefined;
    if (row.type === "team.invited" || row.type === "team_invite") {
      const matched =
        (payload.inviteId ? inviteById.get(payload.inviteId) : undefined) ??
        (payload.eventId ? inviteByEvent.get(payload.eventId) : undefined);
      if (matched && !usedInviteIds.has(matched.id)) {
        usedInviteIds.add(matched.id);
        teamInvite = toTeamInvite(matched, payload.userName);
      }
    }
    return {
      id: row.id,
      createdAt: row.createdAt,
      read: row.readAt !== null,
      ...describeNotification(row.type, payload),
      ...(teamInvite ? { teamInvite } : {}),
    };
  });

  // Pastikan setiap undangan tim PENDING yang masih aktif selalu tampil di panel notifikasi
  // meski notifikasinya sudah tergeser oleh notifikasi lain atau berasal dari seed lama.
  const virtualInvites: NotificationItem[] = pendingInvites
    .filter((inv) => !usedInviteIds.has(inv.id))
    .map((inv) => ({
      id: `invite:${inv.id}`,
      createdAt: inv.createdAt,
      read: false,
      ...describeNotification("team.invited", {
        userName: inv.team.leader.name,
        teamName: inv.team.name,
        eventTitle: inv.team.event.title,
        eventId: inv.team.event.id,
        inviteId: inv.id,
      }),
      teamInvite: toTeamInvite(inv),
    }));

  return {
    items: [...virtualInvites, ...dbItems],
    unread: unread + virtualInvites.length,
  };
}
