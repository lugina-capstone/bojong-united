import { apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

/**
 * Download: redirect ke URL storage sementara.
 * Saat ini hanya pemilik dan Administrator. Akses lain (peserta acara, Guru penilai)
 * ditambahkan bersama relasi file ke materi, tugas, dan sertifikat.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/files/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(401, "unauthorized", "Silakan masuk terlebih dahulu");
  }

  const { id } = await ctx.params;
  const file = await db.file.findUnique({ where: { id } });
  const canRead =
    file &&
    file.status === "UPLOADED" &&
    (file.ownerId === user.id || user.role === "ADMINISTRATOR");
  if (!canRead) return apiError(404, "not_found", "File tidak ditemukan");

  return Response.redirect(await createDownloadUrl(file.key, file.name), 302);
}
