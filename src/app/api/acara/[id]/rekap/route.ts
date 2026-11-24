import { apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { kkmStatusLabel, loadEventResults } from "@/lib/event-results";
import { formatScore } from "@/lib/format";
import { hasPermission } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rekap akhir acara sebagai CSV untuk pengajar di organisasi penyelenggara. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/acara/[id]/rekap">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(401, "unauthorized", "Silakan masuk terlebih dahulu");
  }
  const { id } = await ctx.params;
  const event =
    hasPermission(user, "assessment:manage") && user.membership
      ? await db.event.findFirst({
          where: {
            id,
            organizationId: user.membership.organization.id,
            status: { not: "DRAFT" },
          },
        })
      : null;
  if (!event) return apiError(404, "not_found", "Acara tidak ditemukan");
  const { milestones, rows } = await loadEventResults(id, event.kkm);
  const header = [
    "Nama",
    "Email",
    "Kelompok",
    ...milestones.map((m) => `Milestone ${m.order}`),
    "Nilai akhir",
    "Status KKM",
    "Nomor sertifikat",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      r.team ?? "",
      ...r.cells.map((c) =>
        c.latest?.grade ? formatScore(c.latest.grade.score) : "",
      ),
      r.final === null ? "" : formatScore(r.final),
      kkmStatusLabel[r.kkmStatus],
      r.certificate ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return new Response(`\uFEFF${[header.join(","), ...lines].join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rekap-${slug || "acara"}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
