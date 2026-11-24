import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";

/** Guru/Asesor/Trainer aktif beserta organisasinya. */
export async function requireTeacher() {
  const user = await requirePermission("event:manage");
  return { user, organizationId: user.membership!.organization.id };
}

/** Acara milik pengajar yang sedang login di organisasinya; 404 jika bukan miliknya. */
export async function requireOwnEvent(eventId: string) {
  const { user, organizationId } = await requireTeacher();
  const event = await db.event.findFirst({
    where: { id: eventId, organizationId, creatorId: user.id },
  });
  if (!event) notFound();
  return { user, organizationId, event };
}
