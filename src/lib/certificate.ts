import "server-only";

import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";

/** Sertifikat beserta data cetak; null jika tidak ada atau pengguna tidak berhak melihat. */
export async function loadCertificate(number: string, user: CurrentUser) {
  const certificate = await db.certificate.findUnique({
    where: { number },
    include: {
      enrollment: {
        include: {
          user: { select: { id: true, name: true } },
          event: {
            include: {
              field: { select: { name: true } },
              creator: { select: { name: true } },
              organization: {
                select: {
                  id: true,
                  name: true,
                  members: {
                    where: { userId: user.id, status: "ACTIVE" },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!certificate) return null;
  const { enrollment } = certificate;
  const { event } = enrollment;
  const canView =
    enrollment.userId === user.id ||
    user.role === "ADMINISTRATOR" ||
    event.organization.members.length > 0;
  if (!canView) return null;
  return {
    number: certificate.number,
    issuedAt: certificate.issuedAt,
    finalScore: certificate.finalScore,
    recipient: certificate.recipientName,
    isOwner: enrollment.userId === user.id,
    eventId: event.id,
    eventTitle: event.title,
    kkm: event.kkm,
    title:
      event.certificateTitle ??
      `Kompetensi ${event.field?.name ?? "Pembelajaran Berbasis Proyek"}`,
    issuer: event.certificateIssuer ?? event.organization.name,
    signer: event.certificateSigner ?? event.creator?.name ?? "Penyelenggara",
  };
}

export type CertificateData = NonNullable<
  Awaited<ReturnType<typeof loadCertificate>>
>;
