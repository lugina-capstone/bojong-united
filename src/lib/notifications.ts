import "server-only";

import { db } from "@/lib/db";
import {
  describeNotification,
  type NotificationPayload,
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
};

/** Notifikasi terbaru untuk panel header. */
export async function notificationsFor(userId: string, take = 8) {
  const [rows, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  const items: NotificationItem[] = rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    read: row.readAt !== null,
    ...describeNotification(row.type, row.payload as NotificationPayload),
  }));
  return { items, unread };
}
