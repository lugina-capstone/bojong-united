/** Aturan bisnis acara yang murni (tanpa database), dipakai server dan diuji unit. */

export type EventPhase =
  "draft" | "upcoming" | "ongoing" | "finished" | "archived";

export const eventPhaseLabels: Record<EventPhase, string> = {
  draft: "Draf",
  upcoming: "Belum dimulai",
  ongoing: "Berlangsung",
  finished: "Berakhir",
  archived: "Diarsipkan",
};

/** Fase acara dari status dan tanggal. CLOSED = ditutup lebih awal, dianggap berakhir. */
export function eventPhase(
  event: {
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
    startsAt: Date | null;
    endsAt: Date | null;
  },
  now = new Date(),
): EventPhase {
  if (event.status === "DRAFT") return "draft";
  if (event.status === "ARCHIVED") return "archived";
  if (event.status === "CLOSED") return "finished";
  if (event.endsAt && event.endsAt < now) return "finished";
  if (event.startsAt && event.startsAt > now) return "upcoming";
  return "ongoing";
}

/** Nilai milestone 0–100 = total skor ÷ skor maksimum × 100, tanpa bobot. */
export function milestoneScore(scores: number[]) {
  const total = scores.reduce((sum, score) => sum + score, 0);
  const max = scores.length * 5;
  return {
    total,
    max,
    score: max === 0 ? 0 : Math.round((total / max) * 10000) / 100,
  };
}

/** Nilai akhir = rata-rata nilai milestone; null jika ada milestone yang belum dinilai. */
export function finalScore(milestoneScores: (number | null)[]) {
  if (milestoneScores.length === 0) return null;
  if (milestoneScores.some((score) => score === null)) return null;
  const sum = (milestoneScores as number[]).reduce((a, b) => a + b, 0);
  return Math.round((sum / milestoneScores.length) * 100) / 100;
}

export function passesKkm(score: number | null, kkm: number) {
  return score !== null && score >= kkm;
}

/** Sertifikat terbit jika fitur aktif, semua milestone dinilai, dan nilai akhir ≥ KKM. */
export function shouldIssueCertificate(input: {
  certificateEnabled: boolean;
  kkm: number;
  milestoneScores: (number | null)[];
}) {
  if (!input.certificateEnabled) return false;
  return passesKkm(finalScore(input.milestoneScores), input.kkm);
}

export type MilestoneProgress = {
  submitted: boolean;
  surveyDone: boolean;
  /** Survei tidak ada untuk milestone ini. */
  hasSurvey: boolean;
};

/**
 * Indeks (0-based) milestone terakhir yang terbuka. Milestone 1 terbuka saat acara mulai;
 * berikutnya terbuka setelah tugas dikumpulkan dan survei milestone sebelumnya diisi.
 * -1 jika acara belum dimulai.
 */
export function unlockedMilestoneIndex(
  progress: MilestoneProgress[],
  started: boolean,
) {
  if (!started || progress.length === 0) return -1;
  let index = 0;
  while (index < progress.length - 1) {
    const current = progress[index]!;
    const done =
      current.submitted && (!current.hasSurvey || current.surveyDone);
    if (!done) break;
    index++;
  }
  return index;
}

export type Rule = { allowed: true } | { allowed: false; reason: string };

/** Ketua bisa mengundang selama slot masih ada dan undangan belum melebihi batas. */
export function canInviteToTeam(input: {
  maxMembers: number;
  joined: number;
  pending: number;
  inviteeHasTeam: boolean;
}): Rule {
  if (input.inviteeHasTeam) {
    return {
      allowed: false,
      reason: "Peserta ini sudah tergabung di tim lain.",
    };
  }
  if (input.joined + input.pending >= input.maxMembers) {
    return { allowed: false, reason: "Slot anggota tim sudah penuh." };
  }
  return { allowed: true };
}

/** Anggota yang sudah bergabung hanya bisa dikeluarkan sebelum acara mulai. */
export function canRemoveTeamMember(started: boolean, isLeader: boolean): Rule {
  if (isLeader)
    return { allowed: false, reason: "Ketua tidak bisa dikeluarkan." };
  if (started) {
    return {
      allowed: false,
      reason: "Anggota tidak bisa dikeluarkan setelah acara dimulai.",
    };
  }
  return { allowed: true };
}

/** Acara terbit hanya bisa dihapus jika belum ada peserta. */
export function canDeleteEvent(status: string, participantCount: number): Rule {
  if (status === "DRAFT" || participantCount === 0) return { allowed: true };
  return {
    allowed: false,
    reason: "Acara yang sudah punya peserta tidak bisa dihapus. Arsipkan saja.",
  };
}

/** Nomor sertifikat: BCR-<tahun>-<6 karakter acak>. */
export function certificateNumber(random: string, now = new Date()) {
  return `BCR-${now.getFullYear()}-${random.toUpperCase()}`;
}

/** Samarkan email untuk ditampilkan ke peserta lain: "dimas@x.id" → "di***@x.id". */
export function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  return `${email.slice(0, Math.min(2, at - 1) || 1)}***${email.slice(at)}`;
}
