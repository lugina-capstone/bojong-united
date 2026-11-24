import "server-only";

import { requirePermission } from "@/lib/session";

/** Peserta (tanpa membership organisasi aktif). */
export function requireParticipant() {
  return requirePermission("event:join");
}

/** Acara dianggap sudah dimulai sejak `startsAt`. */
export function hasStarted(event: { startsAt: Date | null }, now = new Date()) {
  return Boolean(event.startsAt && event.startsAt <= now);
}
