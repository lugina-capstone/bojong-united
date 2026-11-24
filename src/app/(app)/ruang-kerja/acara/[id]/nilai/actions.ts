"use server";

import { refresh } from "next/cache";

import {
  issueCertificateIfEligible,
  requireAssessableEvent,
} from "@/lib/assessment";
import { db } from "@/lib/db";
import { milestoneScore } from "@/lib/event-rules";
import { notify } from "@/lib/notifications";
import { gradeSchema, revisionSchema } from "@/lib/validations/event";

export type GradeActionState = { ok?: boolean; error?: string };

/** Pengumpulan versi terbaru yang menunggu dinilai, di acara organisasi penilai. */
async function pendingSubmission(submissionId: string) {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: { select: { name: true } },
      milestone: {
        include: {
          event: { select: { id: true, title: true } },
          rubric: { include: { criteria: { select: { id: true } } } },
        },
      },
    },
  });
  if (!submission) return { error: "Pengumpulan tidak ditemukan." } as const;
  const ctx = await requireAssessableEvent(submission.milestone.eventId);
  const newer = await db.submission.count({
    where: {
      milestoneId: submission.milestoneId,
      userId: submission.userId,
      version: { gt: submission.version },
    },
  });
  if (newer > 0 || submission.status !== "SUBMITTED")
    return { error: "Pengumpulan ini sudah diproses." } as const;
  return { submission, ...ctx } as const;
}

/** Kirim nilai rubrik 1–5 per kriteria untuk satu pengumpulan. */
export async function gradeSubmissionAction(
  submissionId: string,
  input: unknown,
): Promise<GradeActionState> {
  const found = await pendingSubmission(submissionId);
  if ("error" in found) return { error: found.error };
  const { submission, user } = found;
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { error: "Lengkapi skor setiap kriteria." };
  const criteria = submission.milestone.rubric?.criteria ?? [];
  const byId = new Map(parsed.data.scores.map((s) => [s.criterionId, s.score]));
  if (criteria.length === 0 || criteria.some((c) => !byId.has(c.id)))
    return { error: "Lengkapi skor setiap kriteria." };
  const scores = criteria.map((c) => ({
    criterionId: c.id,
    score: byId.get(c.id)!,
  }));
  const result = milestoneScore(scores.map((s) => s.score));

  try {
    await db.$transaction([
      db.grade.create({
        data: {
          submissionId,
          graderId: user.id,
          totalScore: result.total,
          maxScore: result.max,
          score: result.score,
          feedback: parsed.data.feedback,
          scores: { create: scores },
        },
      }),
      db.submission.update({
        where: { id: submissionId, status: "SUBMITTED" },
        data: { status: "GRADED" },
      }),
    ]);
  } catch {
    return { error: "Pengumpulan ini sudah diproses." };
  }
  const { milestone } = submission;
  await notify([submission.userId], "grade.published", {
    eventId: milestone.event.id,
    eventTitle: milestone.event.title,
    milestoneTitle: milestone.title,
    milestoneOrder: String(milestone.order),
    score: String(result.score),
  });
  await issueCertificateIfEligible(milestone.event.id, submission.userId);
  refresh();
  return { ok: true };
}

/** Minta peserta memperbaiki pengumpulan; peserta lalu mengirim versi berikutnya. */
export async function requestRevisionAction(
  submissionId: string,
  input: unknown,
): Promise<GradeActionState> {
  const found = await pendingSubmission(submissionId);
  if ("error" in found) return { error: found.error };
  const { submission, user } = found;
  const parsed = revisionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  try {
    await db.$transaction([
      db.revisionRequest.create({
        data: { submissionId, requestedById: user.id, note: parsed.data.note },
      }),
      db.submission.update({
        where: { id: submissionId, status: "SUBMITTED" },
        data: { status: "REVISION_REQUESTED" },
      }),
    ]);
  } catch {
    return { error: "Pengumpulan ini sudah diproses." };
  }
  const { milestone } = submission;
  await notify([submission.userId], "revision.requested", {
    eventId: milestone.event.id,
    eventTitle: milestone.event.title,
    milestoneTitle: milestone.title,
    milestoneOrder: String(milestone.order),
  });
  refresh();
  return { ok: true };
}
