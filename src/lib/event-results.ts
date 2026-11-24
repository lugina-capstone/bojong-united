import "server-only";

import { db } from "@/lib/db";
import { finalScore } from "@/lib/event-rules";

export type KkmStatus = "lulus" | "bawah" | "belum";

/** Hasil per peserta untuk satu acara: milestone terbaru, survei, nilai akhir, status KKM, dan sertifikat. */
export async function loadEventResults(eventId: string, kkm: number) {
  const [milestones, enrollments] = await Promise.all([
    db.milestone.findMany({
      where: { eventId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        order: true,
        title: true,
        survey: {
          select: {
            questions: { select: { id: true, type: true } },
            responses: {
              select: {
                userId: true,
                submittedAt: true,
                answers: { select: { questionId: true, value: true } },
              },
            },
          },
        },
        submissions: {
          orderBy: { version: "desc" },
          select: {
            id: true,
            userId: true,
            version: true,
            status: true,
            submittedAt: true,
            link: true,
            text: true,
            file: { select: { id: true, name: true, contentType: true } },
            grade: { select: { score: true, feedback: true } },
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { eventId },
      orderBy: { user: { name: "asc" } },
      select: {
        userId: true,
        user: { select: { name: true, email: true } },
        team: { select: { name: true } },
        certificate: { select: { number: true } },
      },
    }),
  ]);

  const rows = enrollments.map((en) => {
    const cells = milestones.map((m) => {
      const latest = m.submissions.find((s) => s.userId === en.userId) ?? null;
      const response =
        m.survey?.responses.find((r) => r.userId === en.userId) ?? null;
      const ratingIds = new Set(
        m.survey?.questions
          .filter((q) => q.type === "RATING")
          .map((q) => q.id) ?? [],
      );
      const ratings =
        response?.answers
          .filter((a) => ratingIds.has(a.questionId))
          .map((a) => Number(a.value))
          .filter((v) => Number.isFinite(v)) ?? [];
      return {
        milestone: m,
        latest,
        hasSurvey: Boolean(m.survey),
        response,
        instrument:
          ratings.length === 0
            ? null
            : Math.round(
                (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10,
              ) / 10,
      };
    });
    const final = finalScore(cells.map((c) => c.latest?.grade?.score ?? null));
    const kkmStatus: KkmStatus =
      final === null ? "belum" : final >= kkm ? "lulus" : "bawah";
    return {
      userId: en.userId,
      name: en.user.name,
      email: en.user.email,
      team: en.team?.name ?? null,
      certificate: en.certificate?.number ?? null,
      cells,
      submitted: cells.filter((c) => c.latest).length,
      graded: cells.filter((c) => c.latest?.grade).length,
      surveysDone: cells.filter((c) => c.response).length,
      final,
      kkmStatus,
    };
  });
  return { milestones, rows };
}

export type EventResultRow = Awaited<
  ReturnType<typeof loadEventResults>
>["rows"][number];

export const kkmStatusLabel: Record<KkmStatus, string> = {
  lulus: "Mencapai KKM",
  bawah: "Di bawah KKM",
  belum: "Belum lengkap",
};

/** Event terbit/ditutup/diarsipkan di organisasi pengajar (untuk pilihan filter). */
export function assessableEvents(organizationId: string) {
  return db.event.findMany({
    where: { organizationId, status: { not: "DRAFT" } },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      endsAt: true,
      kkm: true,
      createdAt: true,
      field: { select: { name: true } },
      _count: { select: { enrollments: true, milestones: true } },
    },
  });
}
