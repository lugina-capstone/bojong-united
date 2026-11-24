import { apiError } from "@/lib/api/response";
import { loadCertificate } from "@/lib/certificate";
import { renderCertificatePdf } from "@/lib/certificate-pdf";
import { getCurrentUser } from "@/lib/session";

/** Unduh sertifikat sebagai PDF; hanya pemilik, Administrator, dan anggota organisasi penyelenggara. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/sertifikat/[number]/pdf">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(401, "unauthorized", "Silakan masuk terlebih dahulu");
  }
  const { number } = await ctx.params;
  const data = await loadCertificate(number, user);
  if (!data) return apiError(404, "not_found", "Sertifikat tidak ditemukan");
  const bytes = await renderCertificatePdf(data);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sertifikat-${data.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
