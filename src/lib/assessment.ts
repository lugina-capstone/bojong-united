import "server-only";

import { randomBytes } from "node:crypto";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import {
  certificateNumber,
  finalScore,
  shouldIssueCertificate,
} from "@/lib/event-rules";
import { notify } from "@/lib/notifications";
import { requirePermission } from "@/lib/session";

/** Pengajar dengan izin menilai dan acara terbit di organisasinya; 404 jika bukan. */
export async function requireAssessableEvent(eventId: string) {
  const user = await requirePermission("assessment:manage");
  const organizationId = user.membership!.organization.id;
  const event = await db.event.findFirst({
    where: { id: eventId, organizationId, status: { not: "DRAFT" } },
  });
  if (!event) notFound();
  return { user, organizationId, event };
}

/** Nilai milestone terbaru per milestone untuk satu peserta (null jika belum dinilai). */
export async function latestMilestoneScores(eventId: string, userId: string) {
  const milestones = await db.milestone.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    select: {
      survey: {
        select: { responses: { where: { userId }, select: { id: true } } },
      },
      submissions: {
        where: { userId },
        orderBy: { version: "desc" },
        take: 1,
        select: { status: true, grade: { select: { score: true } } },
      },
    },
  });
  return milestones.map((m) => {
    const latest = m.submissions[0];
    return {
      score:
        latest?.status === "GRADED" && latest.grade ? latest.grade.score : null,
      surveyDone: !m.survey || m.survey.responses.length > 0,
    };
  });
}

/**
 * Terbitkan sertifikat jika semua milestone dinilai, semua survei terisi,
 * dan nilai akhir memenuhi KKM. Aman dipanggil berulang.
 */
export async function issueCertificateIfEligible(
  eventId: string,
  userId: string,
) {
  const enrollment = await db.enrollment.findUnique({
    where: { eventId_userId: { eventId, userId } },
    include: {
      certificate: true,
      event: true,
      user: { select: { name: true } },
    },
  });
  if (!enrollment || enrollment.certificate) return null;
  const { event } = enrollment;
  const rows = await latestMilestoneScores(eventId, userId);
  if (rows.some((r) => !r.surveyDone)) return null;
  const scores = rows.map((r) => r.score);
  if (
    !shouldIssueCertificate({
      certificateEnabled: event.certificateEnabled,
      kkm: event.kkm,
      milestoneScores: scores,
    })
  )
    return null;
  try {
    const certificate = await db.certificate.create({
      data: {
        enrollmentId: enrollment.id,
        templateId: event.certificateTemplateId,
        number: certificateNumber(randomBytes(4).toString("hex")),
        recipientName: enrollment.user.name,
        finalScore: finalScore(scores)!,
      },
    });
    await notify([userId], "certificate.issued", {
      eventId,
      eventTitle: event.title,
      certificateNumber: certificate.number,
    });
    return certificate;
  } catch {
    return null;
  }
}
