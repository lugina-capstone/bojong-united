"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { publishIssues } from "@/lib/event-publish";
import { canDeleteEvent } from "@/lib/event-rules";
import { notify } from "@/lib/notifications";
import { requireOwnEvent, requireTeacher } from "@/lib/teacher-access";
import {
  certificateSchema,
  editEventSchema,
  eventInfoSchema,
  fieldNameSchema,
  milestonesSchema,
  rubricAssignmentSchema,
} from "@/lib/validations/event";

export type EventActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  eventId?: string;
  fieldId?: string;
};

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Survei refleksi bawaan per milestone. Diganti survei FOMO di tahap integrasi. */
const defaultSurveyQuestions: Prisma.SurveyQuestionCreateWithoutSurveyInput[] =
  [
    {
      order: 1,
      text: "Seberapa jelas instruksi milestone ini?",
      type: "RATING",
    },
    {
      order: 2,
      text: "Bagian mana yang paling menantang?",
      type: "SINGLE_CHOICE",
      options: ["Riset", "Eksekusi", "Presentasi"],
    },
    {
      order: 3,
      text: "Apa yang ingin Anda tingkatkan di milestone berikutnya?",
      type: "TEXT",
      required: false,
    },
  ];

export async function createSubjectFieldAction(
  name: string,
): Promise<EventActionState> {
  const { organizationId } = await requireTeacher();
  const parsed = fieldNameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const existing = await db.subjectField.findFirst({
    where: {
      name: { equals: parsed.data, mode: "insensitive" },
      OR: [{ organizationId }, { organizationId: null }],
    },
  });
  if (existing) return { ok: true, fieldId: existing.id };
  const field = await db.subjectField.create({
    data: { name: parsed.data, organizationId },
  });
  return { ok: true, fieldId: field.id };
}

async function assertFieldAvailable(fieldId: string, organizationId: string) {
  return db.subjectField.findFirst({
    where: { id: fieldId, OR: [{ organizationId }, { organizationId: null }] },
  });
}

export async function saveEventInfoAction(
  eventId: string | null,
  input: unknown,
): Promise<EventActionState> {
  const { user, organizationId } = await requireTeacher();
  const parsed = eventInfoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian yang ditandai.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const data = parsed.data;
  if (!(await assertFieldAvailable(data.fieldId, organizationId))) {
    return { fieldErrors: { fieldId: "Bidang tidak ditemukan" } };
  }
  const materials = await db.material.findMany({
    where: {
      id: { in: data.materialIds },
      organizationId,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  const values = {
    title: data.title,
    fieldId: data.fieldId,
    description: data.description,
    guidelines: data.guidelines,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    participantType: data.participantType,
    maxTeamMembers:
      data.participantType === "TEAM" ? (data.maxTeamMembers ?? null) : null,
  };

  if (!eventId) {
    const event = await db.event.create({
      data: {
        ...values,
        organizationId,
        creatorId: user.id,
        draftStep: 2,
        materials: {
          create: materials.map((m) => ({ materialId: m.id })),
        },
      },
    });
    return { ok: true, eventId: event.id };
  }

  const { event } = await requireOwnEvent(eventId);
  if (event.status !== "DRAFT") return { error: "Acara sudah diterbitkan." };
  await db.$transaction([
    db.event.update({
      where: { id: event.id },
      data: { ...values, draftStep: Math.max(event.draftStep, 2) },
    }),
    db.eventMaterial.deleteMany({
      where: { eventId: event.id, material: { status: "PUBLISHED" } },
    }),
    db.eventMaterial.createMany({
      data: materials.map((m) => ({ eventId: event.id, materialId: m.id })),
      skipDuplicates: true,
    }),
  ]);
  return { ok: true, eventId: event.id };
}

export async function saveMilestonesAction(
  eventId: string,
  input: unknown,
): Promise<EventActionState> {
  const { user, event } = await requireOwnEvent(eventId);
  if (event.status !== "DRAFT") return { error: "Acara sudah diterbitkan." };
  const parsed = milestonesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali milestone yang ditandai.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const milestones = parsed.data;
  const fieldErrors: Record<string, string> = {};
  milestones.forEach((m, index) => {
    if (
      (event.startsAt && m.dueAt < event.startsAt) ||
      (event.endsAt && m.dueAt > event.endsAt)
    ) {
      fieldErrors[`${index}.dueAt`] =
        "Tenggat harus berada dalam periode acara";
    }
  });
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali milestone yang ditandai.", fieldErrors };
  }

  const fileIds = milestones.flatMap((m) => m.attachmentFileIds);
  const files = await db.file.findMany({
    where: {
      id: { in: fileIds },
      ownerId: user.id,
      status: "UPLOADED",
    },
    select: { id: true },
  });
  const ownedFiles = new Set(files.map((f) => f.id));
  const keepIds = milestones.flatMap((m) => (m.id ? [m.id] : []));

  await db.$transaction(async (tx) => {
    await tx.milestone.deleteMany({
      where: { eventId, id: { notIn: keepIds } },
    });
    // Geser urutan sementara agar unique (eventId, order) tidak bentrok.
    await tx.milestone.updateMany({
      where: { eventId },
      data: { order: { increment: 1000 } },
    });
    for (const [index, m] of milestones.entries()) {
      const data = {
        order: index + 1,
        title: m.title,
        instructions: m.instructions,
        formats: m.formats,
        dueAt: m.dueAt,
      };
      const saved = m.id
        ? await tx.milestone.update({
            where: { id: m.id, eventId },
            data,
          })
        : await tx.milestone.create({ data: { ...data, eventId } });
      await tx.milestoneAttachment.deleteMany({
        where: { milestoneId: saved.id },
      });
      const attach = m.attachmentFileIds.filter((id) => ownedFiles.has(id));
      if (attach.length > 0) {
        await tx.milestoneAttachment.createMany({
          data: attach.map((fileId) => ({ milestoneId: saved.id, fileId })),
          skipDuplicates: true,
        });
      }
    }
    await tx.event.update({
      where: { id: eventId },
      data: { draftStep: Math.max(event.draftStep, 3) },
    });
  });
  return { ok: true, eventId };
}

export async function saveRubricAssignmentsAction(
  eventId: string,
  input: unknown,
): Promise<EventActionState> {
  const { organizationId, event } = await requireOwnEvent(eventId);
  if (event.status !== "DRAFT") return { error: "Acara sudah diterbitkan." };
  const parsed = rubricAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Data rubrik tidak valid." };
  const missing = parsed.data.filter((a) => !a.rubricId);
  if (missing.length > 0) {
    return {
      error: "Setiap milestone wajib memakai rubrik.",
      fieldErrors: Object.fromEntries(
        missing.map((a) => [a.milestoneId, "Pilih rubrik"]),
      ),
    };
  }
  const rubricIds = [...new Set(parsed.data.map((a) => a.rubricId!))];
  const rubrics = await db.rubric.count({
    where: { id: { in: rubricIds }, organizationId, archivedAt: null },
  });
  if (rubrics !== rubricIds.length) return { error: "Rubrik tidak ditemukan." };
  await db.$transaction([
    ...parsed.data.map((a) =>
      db.milestone.update({
        where: { id: a.milestoneId, eventId },
        data: { rubricId: a.rubricId },
      }),
    ),
    db.event.update({
      where: { id: eventId },
      data: { draftStep: Math.max(event.draftStep, 4) },
    }),
  ]);
  return { ok: true, eventId };
}

export async function saveCertificateAction(
  eventId: string,
  input: unknown,
): Promise<EventActionState> {
  const { event } = await requireOwnEvent(eventId);
  if (event.status !== "DRAFT") return { error: "Acara sudah diterbitkan." };
  const parsed = certificateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian yang ditandai.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const data = parsed.data;
  await db.event.update({
    where: { id: eventId },
    data: {
      kkm: data.kkm,
      certificateEnabled: data.certificateEnabled,
      certificateTemplateId: data.certificateEnabled
        ? (data.certificateTemplateId ?? null)
        : null,
      certificateTitle: data.certificateTitle,
      certificateIssuer: data.certificateIssuer,
      certificateSigner: data.certificateSigner,
      draftStep: Math.max(event.draftStep, 5),
    },
  });
  return { ok: true, eventId };
}

export async function publishEventAction(
  eventId: string,
): Promise<EventActionState> {
  const { event } = await requireOwnEvent(eventId);
  if (event.status !== "DRAFT") return { error: "Acara sudah diterbitkan." };
  const issues = await publishIssues(eventId);
  if (issues.length > 0) return { error: issues[0] };

  await db.$transaction(async (tx) => {
    const milestones = await tx.milestone.findMany({
      where: { eventId, survey: null },
    });
    for (const m of milestones) {
      await tx.survey.create({
        data: {
          milestoneId: m.id,
          title: `Survei Refleksi M${m.order}`,
          questions: { create: defaultSurveyQuestions },
        },
      });
    }
    await tx.event.update({
      where: { id: eventId },
      data: { status: "PUBLISHED", publishedAt: new Date(), draftStep: 5 },
    });
  });
  redirect(`/ruang-kerja/acara/${eventId}/selesai`);
}

export async function deleteEventAction(
  eventId: string,
): Promise<EventActionState> {
  const { event } = await requireOwnEvent(eventId);
  const participants = await db.enrollment.count({ where: { eventId } });
  const rule = canDeleteEvent(event.status, participants);
  if (!rule.allowed) return { error: rule.reason };
  await db.event.delete({ where: { id: eventId } });
  refresh();
  return { ok: true };
}

export async function closeEventAction(
  eventId: string,
): Promise<EventActionState> {
  const { event } = await requireOwnEvent(eventId);
  if (event.status !== "PUBLISHED")
    return { error: "Hanya acara terbit yang bisa ditutup." };
  await db.event.update({
    where: { id: eventId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  refresh();
  return { ok: true };
}

export async function archiveEventAction(
  eventId: string,
): Promise<EventActionState> {
  const { event } = await requireOwnEvent(eventId);
  if (event.status !== "PUBLISHED" && event.status !== "CLOSED")
    return { error: "Hanya acara terbit yang bisa diarsipkan." };
  await db.event.update({
    where: { id: eventId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  refresh();
  return { ok: true };
}

/** Edit terbatas acara terbit: teks, perpanjang tanggal selesai, dan tenggat milestone yang belum dikumpulkan. */
export async function editPublishedEventAction(
  eventId: string,
  input: unknown,
): Promise<EventActionState> {
  const { event } = await requireOwnEvent(eventId);
  if (event.status !== "PUBLISHED")
    return { error: "Hanya acara terbit yang bisa diedit di sini." };
  const parsed = editEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian yang ditandai.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const { milestones: dues, ...data } = parsed.data;
  const fieldErrors: Record<string, string> = {};
  if (event.endsAt && data.endsAt < event.endsAt) {
    fieldErrors.endsAt =
      "Tanggal selesai hanya bisa diperpanjang, tidak dimajukan";
  }
  const current = await db.milestone.findMany({
    where: { eventId },
    select: {
      id: true,
      order: true,
      title: true,
      dueAt: true,
      _count: { select: { submissions: true } },
    },
  });
  const changed: { id: string; dueAt: Date; title: string }[] = [];
  for (const due of dues) {
    const index = current.findIndex((m) => m.id === due.id);
    const milestone = current[index];
    if (!milestone) return { error: "Milestone tidak ditemukan." };
    if (milestone.dueAt && due.dueAt.getTime() === milestone.dueAt.getTime())
      continue;
    const key = `milestones.${index}.dueAt`;
    if (milestone._count.submissions > 0)
      fieldErrors[key] = "Milestone yang sudah dikumpulkan terkunci";
    else if (milestone.dueAt && due.dueAt < milestone.dueAt)
      fieldErrors[key] = "Tenggat hanya bisa diperpanjang";
    else if (due.dueAt > data.endsAt)
      fieldErrors[key] = "Tenggat melewati tanggal selesai acara";
    else changed.push({ id: due.id, dueAt: due.dueAt, title: milestone.title });
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  await db.$transaction([
    db.event.update({ where: { id: eventId }, data }),
    ...changed.map((m) =>
      db.milestone.update({ where: { id: m.id }, data: { dueAt: m.dueAt } }),
    ),
  ]);
  const extended = event.endsAt && data.endsAt > event.endsAt;
  if (changed.length > 0 || extended) {
    const participants = await db.enrollment.findMany({
      where: { eventId },
      select: { userId: true },
    });
    await notify(
      participants.map((p) => p.userId),
      "event.updated",
      {
        eventId,
        eventTitle: data.title,
        change:
          changed.length > 0
            ? `Tenggat ${changed.map((m) => m.title).join(", ")} diperpanjang`
            : "Tanggal selesai diperpanjang",
      },
    );
  }
  refresh();
  return { ok: true };
}
