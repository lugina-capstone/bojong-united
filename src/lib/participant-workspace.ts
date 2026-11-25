import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { eventPhase, unlockedMilestoneIndex } from "@/lib/event-rules";
import { hasStarted } from "@/lib/participant-access";

export type MilestoneView = Awaited<
  ReturnType<typeof loadWorkspace>
>["milestones"][number];

/**
 * Ruang kerja peserta: acara yang diikuti beserta milestone, pengumpulan, survei,
 * dan status terbuka/terkunci. 404 jika peserta tidak terdaftar.
 */
export async function loadWorkspace(eventId: string, userId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { eventId_userId: { eventId, userId } },
    include: {
      team: { select: { name: true } },
      certificate: { select: { number: true, finalScore: true } },
    },
  });
  if (!enrollment) notFound();
  const event = await db.event.findFirst({
    where: { id: eventId, status: { not: "DRAFT" } },
    include: {
      field: { select: { name: true } },
      creator: { select: { id: true, name: true } },
      organization: { select: { name: true, status: true } },
      materials: {
        include: {
          material: {
            select: { id: true, title: true, description: true, status: true },
          },
        },
      },
      milestones: {
        orderBy: { order: "asc" },
        include: {
          attachments: {
            include: {
              file: {
                select: { id: true, name: true, size: true, contentType: true },
              },
            },
          },
          rubric: {
            select: {
              title: true,
              criteria: { orderBy: { order: "asc" }, select: { name: true } },
            },
          },
          survey: {
            include: {
              questions: { orderBy: { order: "asc" } },
              responses: { where: { userId }, select: { id: true } },
            },
          },
          submissions: {
            where: { userId },
            orderBy: { version: "desc" },
            include: {
              file: {
                select: { id: true, name: true, size: true, contentType: true },
              },
              revisionRequest: {
                include: { requestedBy: { select: { name: true } } },
              },
              grade: {
                include: {
                  scores: {
                    include: {
                      criterion: { select: { name: true, order: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!event) notFound();

  const now = new Date();
  const started = hasStarted(event, now);
  const progress = event.milestones.map((m) => ({
    submitted: m.submissions.length > 0,
    hasSurvey: Boolean(m.survey),
    surveyDone: Boolean(m.survey?.responses.length),
  }));
  const unlocked = unlockedMilestoneIndex(progress, started);
  const phase = eventPhase(event, now);
  const paused = event.organization.status !== "APPROVED";
  const readOnly = paused || phase === "finished" || phase === "archived";

  const milestones = event.milestones.map((m, index) => {
    const latest = m.submissions[0] ?? null;
    const overdue = Boolean(m.dueAt && m.dueAt < now);
    return {
      ...m,
      index,
      latest,
      locked: index > unlocked,
      overdue,
      surveyDone: progress[index]!.surveyDone,
      canSubmit:
        !readOnly &&
        index <= unlocked &&
        (latest === null ? !overdue : latest.status === "REVISION_REQUESTED"),
    };
  });
  const submittedCount = progress.filter((p) => p.submitted).length;

  return {
    event,
    enrollment,
    milestones,
    unlocked,
    started,
    phase,
    paused,
    readOnly,
    submittedCount,
  };
}
