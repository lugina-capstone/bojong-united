"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { requireOwnMaterial, requireTrainer } from "@/lib/material-access";
import { canDeleteMaterial, materialProgress } from "@/lib/material-rules";
import { notify } from "@/lib/notifications";
import { deleteObject } from "@/lib/storage";
import {
  materialInfoSchema,
  materialPublishSchema,
  materialSectionsSchema,
} from "@/lib/validations/material";

export type MaterialActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  materialId?: string;
  categoryId?: string;
  archiveSuggested?: boolean;
  sectionIds?: string[];
};

/** Hapus berkas bagian yang sudah tidak dipakai materi mana pun dari storage privat. */
async function removeUnusedFiles(fileIds: (string | null)[]) {
  const ids = fileIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  const files = await db.file.findMany({
    where: { id: { in: ids }, materialSection: null },
    select: { id: true, key: true },
  });
  await Promise.all(
    files.map((f) => deleteObject(f.key).catch(() => undefined)),
  );
  await db.file.deleteMany({ where: { id: { in: files.map((f) => f.id) } } });
}

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Kategori bawaan atau milik organisasi; "Lainnya" membuat kategori baru di organisasi. */
async function resolveCategory(
  organizationId: string,
  categoryId: string,
  newCategory: string,
) {
  if (categoryId) {
    return db.materialCategory.findFirst({
      where: {
        id: categoryId,
        OR: [{ organizationId }, { organizationId: null }],
      },
      select: { id: true },
    });
  }
  const existing = await db.materialCategory.findFirst({
    where: {
      name: { equals: newCategory, mode: "insensitive" },
      OR: [{ organizationId }, { organizationId: null }],
    },
    select: { id: true },
  });
  if (existing) return existing;
  try {
    return await db.materialCategory.create({
      data: { organizationId, name: newCategory },
      select: { id: true },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return db.materialCategory.findFirst({
      where: { organizationId, name: newCategory },
      select: { id: true },
    });
  }
}

/** Langkah 1: simpan informasi materi (membuat draf jika baru). */
export async function saveMaterialInfoAction(
  materialId: string | null,
  input: unknown,
): Promise<MaterialActionState> {
  const { user, organizationId } = await requireTrainer();
  const parsed = materialInfoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian yang ditandai.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const data = parsed.data;
  const category = await resolveCategory(
    organizationId,
    data.categoryId,
    data.newCategory,
  );
  if (!category)
    return { fieldErrors: { categoryId: "Kategori tidak ditemukan" } };
  const values = {
    title: data.title,
    description: data.description,
    outcomes: data.outcomes,
    categoryId: category.id,
    level: data.level,
    coverColor: data.coverColor,
  };
  if (materialId) {
    const { material } = await requireOwnMaterial(materialId);
    await db.material.update({
      where: { id: material.id },
      data: { ...values, draftStep: Math.max(material.draftStep, 2) },
    });
    refresh();
    return { ok: true, materialId: material.id, categoryId: category.id };
  }
  const created = await db.material.create({
    data: { ...values, organizationId, trainerId: user.id, draftStep: 2 },
  });
  refresh();
  return { ok: true, materialId: created.id, categoryId: category.id };
}

/** Hitung ulang progres semua peserta setelah bagian berubah. */
async function recomputeProgress(materialId: string) {
  const [total, enrollments] = await Promise.all([
    db.materialSection.count({ where: { materialId } }),
    db.materialEnrollment.findMany({
      where: { materialId },
      select: {
        id: true,
        completedAt: true,
        _count: { select: { sections: true } },
      },
    }),
  ]);
  await Promise.all(
    enrollments.map((e) => {
      const progress = materialProgress(e._count.sections, total);
      return db.materialEnrollment.update({
        where: { id: e.id },
        data: {
          progress,
          completedAt: progress === 100 ? (e.completedAt ?? new Date()) : null,
        },
      });
    }),
  );
}

/** Langkah 2: simpan bagian materi sesuai urutan. */
export async function saveMaterialSectionsAction(
  materialId: string,
  input: unknown,
): Promise<MaterialActionState> {
  const { user, material } = await requireOwnMaterial(materialId);
  const parsed = materialSectionsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali bagian materi.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const sections = parsed.data;
  const existing = await db.materialSection.findMany({
    where: { materialId },
    select: { id: true, fileId: true },
  });
  const existingIds = new Set(existing.map((s) => s.id));
  const keptFiles = new Set(existing.map((s) => s.fileId).filter(Boolean));
  const fileIds = sections.flatMap((s) => (s.fileId ? [s.fileId] : []));
  const newFileIds = fileIds.filter((id) => !keptFiles.has(id));
  if (new Set(fileIds).size !== fileIds.length) {
    return { error: "Satu berkas hanya boleh dipakai di satu bagian." };
  }
  if (newFileIds.length > 0) {
    const owned = await db.file.count({
      where: {
        id: { in: newFileIds },
        ownerId: user.id,
        status: "UPLOADED",
        materialSection: null,
      },
    });
    if (owned !== newFileIds.length) {
      return { error: "Ada berkas yang belum selesai diunggah." };
    }
  }
  const keepIds = sections.flatMap((s) =>
    s.id && existingIds.has(s.id) ? [s.id] : [],
  );
  const sectionIds = await db.$transaction(async (tx) => {
    const ids: string[] = [];
    await tx.materialSection.deleteMany({
      where: { materialId, id: { notIn: keepIds } },
    });
    await tx.materialSection.updateMany({
      where: { materialId },
      data: { order: { increment: 1000 } },
    });
    for (const [index, s] of sections.entries()) {
      const values = {
        order: index + 1,
        title: s.title,
        content: s.content || null,
        fileId: s.fileId,
        link: s.link || null,
        durationMinutes: s.durationMinutes,
      };
      if (s.id && existingIds.has(s.id)) {
        await tx.materialSection.update({ where: { id: s.id }, data: values });
        ids.push(s.id);
      } else {
        const created = await tx.materialSection.create({
          data: { ...values, materialId },
        });
        ids.push(created.id);
      }
    }
    await tx.material.update({
      where: { id: materialId },
      data: { draftStep: Math.max(material.draftStep, 3) },
    });
    return ids;
  });
  await removeUnusedFiles(existing.map((s) => s.fileId));
  if (material.status !== "DRAFT") await recomputeProgress(materialId);
  refresh();
  return { ok: true, materialId, sectionIds };
}

async function notifyAttached(
  materialTitle: string,
  materialId: string,
  eventIds: string[],
) {
  if (eventIds.length === 0) return;
  const events = await db.event.findMany({
    where: { id: { in: eventIds } },
    select: { id: true, title: true, creatorId: true },
  });
  await Promise.all(
    events.map((e) =>
      notify([e.creatorId], "material.attached", {
        materialId,
        materialTitle,
        eventId: e.id,
        eventTitle: e.title,
      }),
    ),
  );
}

/** Langkah 3 dan detail materi: atur visibilitas dan acara yang dilampiri. */
export async function saveMaterialPublishAction(
  materialId: string,
  input: unknown,
): Promise<MaterialActionState> {
  const { organizationId, material } = await requireOwnMaterial(materialId);
  const parsed = materialPublishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Periksa kembali pengaturan materi.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const { visibility, eventIds } = parsed.data;
  const current = await db.eventMaterial.findMany({
    where: { materialId },
    select: { eventId: true, event: { select: { status: true } } },
  });
  const currentIds = new Set(current.map((c) => c.eventId));
  const added = [...new Set(eventIds.filter((id) => !currentIds.has(id)))];
  const events = await db.event.findMany({
    where: {
      id: { in: added },
      organizationId,
      status: { in: ["DRAFT", "PUBLISHED"] },
    },
    select: { id: true },
  });
  if (events.length !== added.length) {
    return { error: "Acara tidak ditemukan atau sudah ditutup." };
  }
  const removable = current
    .filter(
      (c) =>
        !eventIds.includes(c.eventId) &&
        (c.event.status === "DRAFT" || c.event.status === "PUBLISHED"),
    )
    .map((c) => c.eventId);
  await db.$transaction([
    db.eventMaterial.deleteMany({
      where: { materialId, eventId: { in: removable } },
    }),
    db.eventMaterial.createMany({
      data: added.map((eventId) => ({ eventId, materialId })),
      skipDuplicates: true,
    }),
    db.material.update({ where: { id: materialId }, data: { visibility } }),
  ]);
  if (material.status === "PUBLISHED") {
    await notifyAttached(material.title, materialId, added);
  }
  refresh();
  return { ok: true, materialId };
}

/** Terbitkan draf materi lalu kembali ke daftar materi. */
export async function publishMaterialAction(
  materialId: string,
): Promise<MaterialActionState> {
  const { material } = await requireOwnMaterial(materialId);
  if (material.status !== "DRAFT")
    return { error: "Materi sudah diterbitkan." };
  const sections = await db.materialSection.count({ where: { materialId } });
  if (sections === 0) return { error: "Tambahkan minimal satu bagian materi." };
  await db.material.update({
    where: { id: materialId },
    data: { status: "PUBLISHED", publishedAt: new Date(), draftStep: 3 },
  });
  const attached = await db.eventMaterial.findMany({
    where: { materialId },
    select: { eventId: true },
  });
  await notifyAttached(
    material.title,
    materialId,
    attached.map((a) => a.eventId),
  );
  redirect(`/ruang-kerja/materi?terbit=${materialId}`);
}

export async function archiveMaterialAction(
  materialId: string,
): Promise<MaterialActionState> {
  const { material } = await requireOwnMaterial(materialId);
  if (material.status !== "PUBLISHED") {
    return { error: "Hanya materi terbit yang bisa diarsipkan." };
  }
  await db.material.update({
    where: { id: materialId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  refresh();
  return { ok: true, materialId };
}

export async function restoreMaterialAction(
  materialId: string,
): Promise<MaterialActionState> {
  const { material } = await requireOwnMaterial(materialId);
  if (material.status !== "ARCHIVED")
    return { error: "Materi tidak diarsipkan." };
  await db.material.update({
    where: { id: materialId },
    data: { status: "PUBLISHED", archivedAt: null },
  });
  refresh();
  return { ok: true, materialId };
}

/** Hapus materi yang belum pernah diikuti; selain itu sarankan arsipkan. */
export async function deleteMaterialAction(
  materialId: string,
): Promise<MaterialActionState> {
  const { material } = await requireOwnMaterial(materialId);
  const enrollments = await db.materialEnrollment.count({
    where: { materialId },
  });
  if (!canDeleteMaterial(enrollments)) {
    return {
      error: `Materi sudah diikuti ${enrollments} peserta. Arsipkan agar riwayat belajar tetap tersimpan.`,
      archiveSuggested: true,
    };
  }
  const sections = await db.materialSection.findMany({
    where: { materialId },
    select: { fileId: true },
  });
  // Syarat "belum diikuti" ikut dicek saat menghapus, supaya pendaftaran yang masuk bersamaan tidak ikut terhapus.
  const deleted = await db.material.deleteMany({
    where: { id: material.id, enrollments: { none: {} } },
  });
  if (deleted.count === 0) {
    return {
      error:
        "Materi baru saja diikuti peserta. Arsipkan agar riwayat belajar tetap tersimpan.",
      archiveSuggested: true,
    };
  }
  await removeUnusedFiles(sections.map((s) => s.fileId));
  refresh();
  return { ok: true };
}
