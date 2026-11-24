"use server";

import { refresh } from "next/cache";

import { issueCertificateIfEligible } from "@/lib/assessment";
import { db } from "@/lib/db";
import { eventPhase, unlockedMilestoneIndex } from "@/lib/event-rules";
import { notify } from "@/lib/notifications";
import { hasStarted, requireParticipant } from "@/lib/participant-access";
import { submissionSchema } from "@/lib/validations/event";

export type WorkspaceActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Milestone peserta beserta acara dan status terbuka untuk aksi pengumpulan/survei. */
async function milestoneForParticipant(milestoneId: string, userId: string) {
  const milestone = await db.milestone.findFirst({
    where: { id: milestoneId, event: { enrollments: { some: { userId } } } },
    include: {
      event: {
        include: {
          organization: { select: { status: true } },
          milestones: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              title: true,
              survey: {
                select: {
                  id: true,
                  responses: { where: { userId }, select: { id: true } },
                },
              },
              submissions: { where: { userId }, select: { id: true } },
            },
          },
        },
      },
    },
  });
  if (!milestone) return null;
  const { event } = milestone;
  const index = event.milestones.findIndex((m) => m.id === milestoneId);
  const unlocked = unlockedMilestoneIndex(
    event.milestones.map((m) => ({
      submitted: m.submissions.length > 0,
      hasSurvey: Boolean(m.survey),
      surveyDone: Boolean(m.survey?.responses.length),
    })),
    hasStarted(event),
  );
  const phase = eventPhase(event);
  const blocked =
    event.organization.status !== "APPROVED"
      ? "Acara dijeda karena organisasi penyelenggara dinonaktifkan."
      : phase !== "ongoing"
        ? "Acara tidak sedang berlangsung."
        : index > unlocked
          ? "Milestone ini belum terbuka."
          : null;
  return { milestone, event, index, blocked };
}

async function notifyNextUnlocked(
  ctx: NonNullable<Awaited<ReturnType<typeof milestoneForParticipant>>>,
  userId: string,
) {
  const next = ctx.event.milestones[ctx.index + 1];
  if (!next) return;
  await notify([userId], "milestone.unlocked", {
    eventId: ctx.event.id,
    eventTitle: ctx.event.title,
    milestoneTitle: next.title,
    milestoneOrder: String(next.order),
  });
}

const FORMAT_TYPES: Record<string, (type: string) => boolean> = {
  PDF: (t) => t === "application/pdf",
  IMAGE: (t) => t === "image/png" || t === "image/jpeg",
};

/** Kumpulkan milestone (versi 1) atau kirim revisi (versi berikutnya). */
export async function submitMilestoneAction(
  milestoneId: string,
  input: unknown,
): Promise<WorkspaceActionState> {
  const user = await requireParticipant();
  const ctx = await milestoneForParticipant(milestoneId, user.id);
  if (!ctx) return { error: "Milestone tidak ditemukan." };
  if (ctx.blocked) return { error: ctx.blocked };
  const { milestone, event } = ctx;

  const latest = await db.submission.findFirst({
    where: { milestoneId, userId: user.id },
    orderBy: { version: "desc" },
  });
  const isRevision = latest?.status === "REVISION_REQUESTED";
  if (latest && !isRevision)
    return { error: "Milestone ini sudah dikumpulkan." };
  if (!latest && milestone.dueAt && milestone.dueAt < new Date())
    return { error: "Tenggat milestone sudah lewat." };

  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[issue.path.map(String).join(".")] ??= issue.message;
    return { error: "Periksa kembali isian Anda.", fieldErrors };
  }
  const { fileId, link, text } = parsed.data;
  if (!fileId && !link && !text)
    return { error: "Lampirkan berkas, tautan, atau teks jawaban." };
  const formats = milestone.formats as string[];
  if (link && !formats.includes("LINK"))
    return { fieldErrors: { link: "Milestone ini tidak menerima tautan." } };
  if (text && !formats.includes("TEXT"))
    return { fieldErrors: { text: "Milestone ini tidak menerima teks." } };
  if (fileId) {
    const file = await db.file.findFirst({
      where: { id: fileId, ownerId: user.id, status: "UPLOADED" },
      include: {
        submission: { select: { id: true } },
        milestoneAttachment: { select: { fileId: true } },
      },
    });
    if (!file || file.submission || file.milestoneAttachment)
      return { fieldErrors: { file: "Berkas tidak ditemukan. Unggah ulang." } };
    if (!formats.some((f) => FORMAT_TYPES[f]?.(file.contentType)))
      return {
        fieldErrors: {
          file: "Format berkas tidak sesuai ketentuan milestone.",
        },
      };
  }

  const submission = await db.submission.create({
    data: {
      milestoneId,
      userId: user.id,
      version: (latest?.version ?? 0) + 1,
      fileId: fileId ?? null,
      link: link ?? null,
      text: text ?? null,
    },
  });
  await notify(
    [event.creatorId],
    isRevision ? "submission.revised" : "submission.new",
    {
      userName: user.name,
      milestoneTitle: milestone.title,
      eventTitle: event.title,
      eventId: event.id,
      submissionId: submission.id,
    },
  );
  const survey = event.milestones[ctx.index]!.survey;
  if (!isRevision && !survey) await notifyNextUnlocked(ctx, user.id);
  refresh();
  return { ok: true };
}

/** Kirim jawaban survei milestone. Jawaban tidak bisa diubah setelah dikirim. */
export async function submitSurveyAction(
  milestoneId: string,
  answers: Record<string, string>,
): Promise<WorkspaceActionState> {
  const user = await requireParticipant();
  const ctx = await milestoneForParticipant(milestoneId, user.id);
  if (!ctx) return { error: "Milestone tidak ditemukan." };
  if (ctx.blocked) return { error: ctx.blocked };
  const info = ctx.event.milestones[ctx.index]!;
  if (info.submissions.length === 0)
    return { error: "Kumpulkan tugas milestone terlebih dahulu." };
  if (!info.survey) return { error: "Survei tidak tersedia." };
  if (info.survey.responses.length > 0)
    return { error: "Survei ini sudah Anda isi." };

  const questions = await db.surveyQuestion.findMany({
    where: { surveyId: info.survey.id },
    orderBy: { order: "asc" },
  });
  const fieldErrors: Record<string, string> = {};
  const data: { questionId: string; value: string }[] = [];
  for (const question of questions) {
    const value = (answers[question.id] ?? "").trim();
    if (!value) {
      if (question.required)
        fieldErrors[question.id] = "Pertanyaan ini wajib diisi.";
      continue;
    }
    const valid =
      question.type === "RATING"
        ? ["1", "2", "3", "4", "5"].includes(value)
        : question.type === "SINGLE_CHOICE"
          ? question.options.includes(value)
          : value.length <= 2000;
    if (!valid) fieldErrors[question.id] = "Jawaban tidak valid.";
    else data.push({ questionId: question.id, value });
  }
  if (Object.keys(fieldErrors).length > 0)
    return { error: "Lengkapi pertanyaan wajib.", fieldErrors };

  try {
    await db.surveyResponse.create({
      data: {
        surveyId: info.survey.id,
        userId: user.id,
        answers: { create: data },
      },
    });
  } catch {
    return { error: "Survei ini sudah Anda isi." };
  }
  await notifyNextUnlocked(ctx, user.id);
  await issueCertificateIfEligible(ctx.event.id, user.id);
  refresh();
  return { ok: true };
}
