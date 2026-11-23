import { apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { deleteObject, getObjectInfo } from "@/lib/storage";

/** Langkah 2 upload: pastikan file benar-benar ada di storage dengan ukuran dan tipe yang sama. */
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
    const object = await getObjectInfo(file.key);
    if (!object) {
      return apiError(409, "not_uploaded", "File belum diupload ke storage");
    }
    if (object.size !== file.size || object.contentType !== file.contentType) {
      await deleteObject(file.key);
      await db.file.delete({ where: { id: file.id } });
      return apiError(
        400,
        "file_mismatch",
        "File yang diupload tidak sesuai dengan data awal",
      );
    }
    await db.file.update({
      where: { id: file.id },
      data: { status: "UPLOADED", uploadedAt: new Date() },
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
