import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { eventPhase, unlockedMilestoneIndex } from "@/lib/event-rules";
import { hasStarted } from "@/lib/participant-access";
import { isRevisionOverdue } from "@/lib/submission-helpers";

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
      team: {
        select: {
          id: true,
          name: true,
          leaderId: true,
          members: {
            orderBy: { createdAt: "asc" },
            select: {
              userId: true,
              user: { select: { name: true, avatarFileId: true } },
            },
          },
        },
      },
      certificate: { select: { number: true, finalScore: true } },
    },
  });
  if (!enrollment) notFound();
  const event = await db.event.findFirst({
    where: { id: eventId, status: { not: "DRAFT" } },
    include: {
      field: { select: { name: true } },
      creator: { select: { id: true, name: true, avatarFileId: true } },
      organization: { select: { name: true, status: true } },
      materials: {
        where: { material: { status: { not: "DRAFT" } } },
        include: {
          material: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              coverColor: true,
              trainer: { select: { name: true } },
              sections: { select: { durationMinutes: true } },
            },
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
              files: {
                orderBy: { position: "asc" },
                include: {
                  file: {
                    select: {
                      id: true,
                      name: true,
                      size: true,
                      contentType: true,
                    },
                  },
                },
              },
              revisionRequest: {
                include: {
                  requestedBy: { select: { name: true, avatarFileId: true } },
                },
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
          submissionDrafts: {
            where: { userId },
            take: 1,
            include: {
              files: {
                orderBy: { position: "asc" },
                include: {
                  file: {
                    select: {
                      id: true,
                      name: true,
                      size: true,
                      contentType: true,
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
    const draft = m.submissionDrafts[0] ?? null;
    const overdue = Boolean(m.dueAt && m.dueAt < now);
    const revisionOverdue =
      latest?.status === "REVISION_REQUESTED" &&
      isRevisionOverdue(latest.revisionRequest?.dueAt, now);
    return {
      ...m,
      index,
      latest,
      draft,
      locked: index > unlocked,
      overdue,
      revisionOverdue,
      surveyDone: progress[index]!.surveyDone,
      canSubmit:
        !readOnly &&
        index <= unlocked &&
        (latest === null
          ? !overdue
          : latest.status === "REVISION_REQUESTED" && !revisionOverdue),
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
