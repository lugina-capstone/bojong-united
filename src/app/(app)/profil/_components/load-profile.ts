import "server-only";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { db } from "@/lib/db";
import { unfinishedEventWhere } from "@/lib/event-rules";

/** Data Profil Peserta: akun, nomor HP, dan metode masuk (manual/Google). */
export async function loadParticipantProfile() {
  const user = await requireHomeRole(["PESERTA"]);
  const detail = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      phone: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      accounts: { select: { providerId: true, updatedAt: true } },
    },
  });
  const unfinishedEvents = await db.enrollment.count({
    where: { userId: user.id, event: unfinishedEventWhere() },
  });
  const credential = detail.accounts.find((a) => a.providerId === "credential");
  const google = detail.accounts.some((a) => a.providerId === "google");
  return {
    name: user.name,
    email: user.email,
    phone: detail.phone,
    emailVerified: detail.emailVerified,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    hasPassword: Boolean(credential),
    passwordChangedAt: credential?.updatedAt,
    google,
    unfinishedEvents,
    emailNote: google
      ? "Terhubung via Google · tidak dapat diubah langsung."
      : "Terdaftar manual dengan email dan kata sandi · tidak dapat diubah langsung.",
  };
}
