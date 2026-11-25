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
    if (!(await getObjectInfo(file.key))) {
      return apiError(409, "not_uploaded", "File belum diupload ke storage");
    }
    const finalKey = `files/${file.ownerId}/${file.id}`;
    await copyObject(file.key, finalKey);
    const object = await getObjectInfo(finalKey);
    const valid =
      object?.size === file.size &&
      object.contentType === file.contentType &&
      matchesFileSignature(
        file.contentType,
        await readObjectHead(finalKey, FILE_SIGNATURE_LENGTH),
      );
    await deleteObject(file.key).catch(() => undefined);
    if (!valid) {
      await deleteObject(finalKey).catch(() => undefined);
      await db.file.deleteMany({ where: { id: file.id, status: "PENDING" } });
      return apiError(
        400,
        "file_mismatch",
        "Isi file tidak sesuai dengan tipe atau ukuran yang didaftarkan",
      );
    }
    await db.file.updateMany({
      where: { id: file.id, status: "PENDING" },
      data: { key: finalKey, status: "UPLOADED", uploadedAt: new Date() },
    });
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
