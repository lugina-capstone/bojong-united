"use server";

import { refresh } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Tandai notifikasi milik user sebagai dibaca; tanpa `ids` berarti semua. */
export async function markNotificationsReadAction(ids?: string[]) {
  const user = await requireUser();
  await db.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });
  refresh();
}
