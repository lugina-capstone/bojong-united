import { apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createDownloadUrl, createPreviewUrl } from "@/lib/storage";

/**
 * Download: redirect ke URL storage sementara. `?pratinjau=1` menampilkan PDF di browser; tipe lain tetap diunduh.
 * Boleh dibaca: pemilik, Administrator, peserta acara (lampiran milestone),
 * anggota aktif organisasi penyelenggara (lampiran dan karya peserta),
 * serta peserta materi dan anggota organisasi materi (berkas bagian materi).
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/files/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(401, "unauthorized", "Silakan masuk terlebih dahulu");
  }

  const { id } = await ctx.params;
  const file = await db.file.findUnique({ where: { id } });
  if (!file || file.status !== "UPLOADED")
    return apiError(404, "not_found", "File tidak ditemukan");
  const isOrgMember = {
    organization: {
      members: { some: { userId: user.id, status: "ACTIVE" as const } },
    },
  };
  const canRead =
    file.ownerId === user.id ||
    user.role === "ADMINISTRATOR" ||
    (await db.milestoneAttachment.count({
      where: {
        fileId: id,
        milestone: {
          event: {
            OR: [{ enrollments: { some: { userId: user.id } } }, isOrgMember],
          },
        },
      },
    })) > 0 ||
    (await db.submission.count({
      where: { fileId: id, milestone: { event: isOrgMember } },
    })) > 0 ||
    (await db.materialSection.count({
      where: {
        fileId: id,
        material: {
          OR: [{ enrollments: { some: { userId: user.id } } }, isOrgMember],
        },
      },
    })) > 0;
  if (!canRead) return apiError(404, "not_found", "File tidak ditemukan");

  const preview = new URL(request.url).searchParams.get("pratinjau") === "1";
  return Response.redirect(
    await (preview ? createPreviewUrl(file) : createDownloadUrl(file)),
    302,
  );
}
