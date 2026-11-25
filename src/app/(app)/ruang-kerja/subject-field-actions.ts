"use server";

import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { requireTeacher } from "@/lib/teacher-access";
import { fieldNameSchema } from "@/lib/validations/event";

export type SubjectFieldActionState = {
  ok?: boolean;
  error?: string;
  fieldId?: string;
  name?: string;
};

const DUPLICATE = "Bidang dengan nama itu sudah ada.";
const NOT_FOUND = "Bidang tidak ditemukan.";
const USED =
  "Bidang ini sudah dipakai acara atau rubrik. Hanya Admin Organisasi yang dapat mengubah namanya.";

/** Bidang bawaan atau milik organisasi dengan nama yang sama tanpa membedakan huruf besar/kecil. */
async function findByName(organizationId: string, name: string) {
  // `mode: "insensitive"` memakai ILIKE sehingga `_` dan `%` menjadi wildcard; cocokkan ulang secara harfiah.
  const candidates = await db.subjectField.findMany({
    where: {
      name: { equals: name, mode: "insensitive" },
      OR: [{ organizationId }, { organizationId: null }],
    },
    select: { id: true, name: true },
  });
  const wanted = name.toLowerCase();
  return (
    candidates.find((field) => field.name.toLowerCase() === wanted) ?? null
  );
}

/** Menambah bidang organisasi; nama yang sudah ada mengembalikan bidang itu. */
export async function createSubjectFieldAction(
  name: string,
): Promise<SubjectFieldActionState> {
  const { organizationId } = await requireTeacher();
  const parsed = fieldNameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const existing = await findByName(organizationId, parsed.data);
  if (existing) return { ok: true, fieldId: existing.id, name: existing.name };
  try {
    const field = await db.subjectField.create({
      data: { name: parsed.data, organizationId },
    });
    return { ok: true, fieldId: field.id, name: field.name };
  } catch (error) {
    // Dua pengajar menambah nama yang sama bersamaan: pakai bidang yang lebih dulu tersimpan.
    if (!isUniqueViolation(error)) throw error;
    const winner = await findByName(organizationId, parsed.data);
    if (!winner) throw error;
    return { ok: true, fieldId: winner.id, name: winner.name };
  }
}

function usageOf(fieldId: string) {
  return Promise.all([
    db.event.count({ where: { fieldId } }),
    db.rubric.count({ where: { fieldId } }),
  ]).then(([events, rubrics]) => events + rubrics);
}

/**
 * Mengubah nama bidang organisasi. Bidang yang sudah dipakai acara atau rubrik
 * hanya boleh diubah Admin Organisasi karena namanya tampil di karya pengajar lain.
 */
export async function renameSubjectFieldAction(
  fieldId: string,
  name: string,
): Promise<SubjectFieldActionState> {
  const { user, organizationId } = await requireTeacher();
  const parsed = fieldNameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const field = await db.subjectField.findFirst({
    where: { id: fieldId, organizationId },
    select: { id: true },
  });
  if (!field) return { error: NOT_FOUND };
  if (!user.membership?.isAdmin && (await usageOf(field.id)) > 0) {
    return { error: USED };
  }
  const duplicate = await findByName(organizationId, parsed.data);
  if (duplicate && duplicate.id !== field.id) return { error: DUPLICATE };
  const admin = Boolean(user.membership?.isAdmin);
  try {
    // Satu pernyataan: bidang yang baru saja dipakai tidak ikut diubah oleh non-admin.
    const { count } = await db.subjectField.updateMany({
      where: {
        id: field.id,
        ...(admin ? {} : { events: { none: {} }, rubrics: { none: {} } }),
      },
      data: { name: parsed.data },
    });
    if (count === 0) return { error: USED };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return { error: DUPLICATE };
  }
  return { ok: true, fieldId: field.id, name: parsed.data };
}

/** Menghapus bidang organisasi yang belum dipakai acara atau rubrik mana pun. */
export async function deleteSubjectFieldAction(
  fieldId: string,
): Promise<SubjectFieldActionState> {
  const { organizationId } = await requireTeacher();
  // Satu pernyataan: bidang yang baru saja dipakai tidak ikut terhapus.
  const { count } = await db.subjectField.deleteMany({
    where: {
      id: fieldId,
      organizationId,
      events: { none: {} },
      rubrics: { none: {} },
    },
  });
  if (count > 0) return { ok: true, fieldId };
  const field = await db.subjectField.findFirst({
    where: { id: fieldId, organizationId },
    select: { id: true },
  });
  if (!field) return { error: NOT_FOUND };
  return {
    error:
      "Bidang ini masih dipakai acara atau rubrik, jadi tidak dapat dihapus.",
  };
}
