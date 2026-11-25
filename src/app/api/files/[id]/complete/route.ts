import { randomUUID } from "node:crypto";

import { apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  copyObject,
  deleteObject,
  getObjectInfo,
  readObjectHead,
} from "@/lib/storage";
import {
  FILE_SIGNATURE_LENGTH,
  matchesFileSignature,
} from "@/lib/validations/file";

/**
 * Langkah 2 upload: salin unggahan ke key final, lalu cek ukuran, tipe, dan isi salinan itu.
 * Key final tidak punya URL upload, jadi berkas yang sudah lolos tidak bisa ditimpa.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/files/[id]/complete">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(401, "unauthorized", "Silakan masuk terlebih dahulu");
  }

  const { id } = await ctx.params;
  const file = await db.file.findFirst({ where: { id, ownerId: user.id } });
  if (!file) return apiError(404, "not_found", "File tidak ditemukan");

  if (file.status === "PENDING") {
    // Key per percobaan: permintaan yang bersamaan tidak pernah menimpa atau menghapus salinan pemenang.
    const finalKey = `files/${file.ownerId}/${randomUUID()}`;
    const outcome = await finalize(file, finalKey).catch(async (error) => {
      await deleteObject(finalKey).catch(() => undefined);
      throw error;
    });
    if (outcome !== "published") {
      await deleteObject(finalKey).catch(() => undefined);
      const current = await db.file.findUnique({
        where: { id: file.id },
        select: { status: true },
      });
      // Permintaan lain sudah menyelesaikan file ini.
      if (current?.status !== "UPLOADED") {
        if (outcome === "missing")
          return apiError(
            409,
            "not_uploaded",
            "File belum diupload ke storage",
          );
        await deleteObject(file.key).catch(() => undefined);
        await db.file.deleteMany({ where: { id: file.id, status: "PENDING" } });
        return apiError(
          400,
          "file_mismatch",
          "Isi file tidak sesuai dengan tipe atau ukuran yang didaftarkan",
        );
      }
    }
  }

  return Response.json({
    file: {
      id: file.id,
      name: file.name,
      contentType: file.contentType,
      size: file.size,
      status: "UPLOADED",
    },
  });
}

async function finalize(
  file: { id: string; key: string; size: number; contentType: string },
  finalKey: string,
): Promise<"published" | "missing" | "invalid" | "lost"> {
  if (!(await getObjectInfo(file.key))) return "missing";
  try {
    await copyObject(file.key, finalKey);
  } catch (error) {
    // Unggahan sudah dipindahkan permintaan lain di antara dua langkah di atas.
    if (!(await getObjectInfo(file.key))) return "missing";
    throw error;
  }
  const object = await getObjectInfo(finalKey);
  const valid =
    object?.size === file.size &&
    object.contentType === file.contentType &&
    matchesFileSignature(
      file.contentType,
      await readObjectHead(finalKey, FILE_SIGNATURE_LENGTH),
    );
  if (!valid) return "invalid";
  const claimed = await db.file.updateMany({
    where: { id: file.id, status: "PENDING" },
    data: { key: finalKey, status: "UPLOADED", uploadedAt: new Date() },
  });
  if (claimed.count === 0) return "lost";
  // Baru dihapus setelah tersimpan, agar percobaan ulang tetap bisa jika penyimpanan gagal.
  await deleteObject(file.key).catch(() => undefined);
  return "published";
}
