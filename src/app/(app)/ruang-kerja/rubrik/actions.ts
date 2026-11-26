"use server";

import { refresh } from "next/cache";

import { db } from "@/lib/db";
import { canManageRubric, lockedRubricWhere } from "@/lib/rubric-access";
import { requireTeacher } from "@/lib/teacher-access";
import { rubricSchema } from "@/lib/validations/event";

export type RubricActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  rubricId?: string;
};

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues)
    errors[issue.path.map(String).join(".")] ??= issue.message;
  return errors;
}

const NOT_OWNER =
  "Hanya pembuat rubrik atau Admin Organisasi yang bisa mengubahnya. Salin rubrik ini untuk membuat versi Anda.";

function criteriaData(
  criteria: ReturnType<typeof rubricSchema.parse>["criteria"],
) {
  return criteria.map((c, index) => ({ order: index + 1, ...c }));
}

export async function createRubricAction(
  input: unknown,
): Promise<RubricActionState> {
  const { user, organizationId } = await requireTeacher();
  const parsed = rubricSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian rubrik.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const field = await db.subjectField.findFirst({
    where: {
      id: parsed.data.fieldId,
      OR: [{ organizationId }, { organizationId: null }],
    },
  });
  if (!field) return { fieldErrors: { fieldId: "Bidang tidak ditemukan" } };
  const rubric = await db.rubric.create({
    data: {
      organizationId,
      creatorId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      fieldId: field.id,
      criteria: { create: criteriaData(parsed.data.criteria) },
    },
  });
  refresh();
  return { ok: true, rubricId: rubric.id };
}

/**
 * Simpan perubahan rubrik. Jika rubrik terkunci (dipakai menilai atau acara terbit), perubahan disimpan sebagai
 * versi baru (salinan) dan versi lama tetap utuh untuk nilai yang sudah ada.
 */
export async function updateRubricAction(
  rubricId: string,
  input: unknown,
): Promise<RubricActionState> {
  const { user, organizationId } = await requireTeacher();
  const rubric = await db.rubric.findFirst({
    where: { id: rubricId, organizationId, archivedAt: null },
  });
  if (!rubric) return { error: "Rubrik tidak ditemukan." };
  if (!canManageRubric(rubric, user)) return { error: NOT_OWNER };
  const parsed = rubricSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian rubrik.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const field = await db.subjectField.findFirst({
    where: {
      id: parsed.data.fieldId,
      OR: [{ organizationId }, { organizationId: null }],
    },
  });
  if (!field) return { fieldErrors: { fieldId: "Bidang tidak ditemukan" } };
  const used =
    (await db.rubric.count({
      where: { AND: [{ id: rubricId }, lockedRubricWhere] },
    })) > 0;
  if (used) {
    // Nomor versi berikutnya dihitung dari seluruh keluarga rubrik, bukan dari rubrik yang diedit,
    // supaya mengedit versi lama tidak menghasilkan nomor yang sudah dipakai.
    const rootId = rubric.sourceRubricId ?? rubric.id;
    const latest = await db.rubric.aggregate({
      where: { OR: [{ id: rootId }, { sourceRubricId: rootId }] },
      _max: { version: true },
    });
    const copy = await db.rubric.create({
      data: {
        organizationId,
        creatorId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        fieldId: field.id,
        version: (latest._max.version ?? rubric.version) + 1,
        sourceRubricId: rootId,
        criteria: { create: criteriaData(parsed.data.criteria) },
      },
    });
    refresh();
    return { ok: true, rubricId: copy.id };
  }
  await db.$transaction([
    db.rubricCriterion.deleteMany({ where: { rubricId } }),
    db.rubric.update({
      where: { id: rubricId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        fieldId: field.id,
        criteria: { create: criteriaData(parsed.data.criteria) },
      },
    }),
  ]);
  refresh();
  return { ok: true, rubricId };
}

/** Salin rubrik menjadi rubrik baru yang bisa diedit. */
export async function copyRubricAction(
  rubricId: string,
): Promise<RubricActionState> {
  const { user, organizationId } = await requireTeacher();
  const rubric = await db.rubric.findFirst({
    where: { id: rubricId, organizationId },
    include: { criteria: { orderBy: { order: "asc" } } },
  });
  if (!rubric) return { error: "Rubrik tidak ditemukan." };
  const copy = await db.rubric.create({
    data: {
      organizationId,
      creatorId: user.id,
      title: `${rubric.title} (salinan)`,
      description: rubric.description,
      fieldId: rubric.fieldId,
      criteria: {
        create: rubric.criteria.map(
          ({
            order,
            name,
            description,
            level1,
            level2,
            level3,
            level4,
            level5,
          }) => ({
            order,
            name,
            description,
            level1,
            level2,
            level3,
            level4,
            level5,
          }),
        ),
      },
    },
  });
  refresh();
  return { ok: true, rubricId: copy.id };
}

/**
 * Hapus rubrik yang belum dipakai milestone. Rubrik yang sudah dipakai acara diarsipkan
 * agar nilai yang sudah ada tetap utuh.
 */
export async function deleteRubricAction(
  rubricId: string,
): Promise<RubricActionState & { archived?: boolean }> {
  const { user, organizationId } = await requireTeacher();
  const rubric = await db.rubric.findFirst({
    where: { id: rubricId, organizationId, archivedAt: null },
    select: {
      id: true,
      creatorId: true,
      _count: { select: { milestones: true } },
    },
  });
  if (!rubric) return { error: "Rubrik tidak ditemukan." };
  if (!canManageRubric(rubric, user)) return { error: NOT_OWNER };
  if (rubric._count.milestones > 0) {
    await db.rubric.update({
      where: { id: rubricId },
      data: { archivedAt: new Date() },
    });
    refresh();
    return { ok: true, archived: true };
  }
  await db.rubric.delete({ where: { id: rubricId } });
  refresh();
  return { ok: true };
}
