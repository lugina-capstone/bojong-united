/** Helper murni (server & client) untuk pengumpulan multi-berkas dan arahan revisi. */

export const MAX_SUBMISSION_FILES = 5;

export type SubmissionFileMeta = {
  id: string;
  name: string;
  size: number;
  contentType: string;
};

export type RevisionFocusPoint = {
  title: string;
  detail?: string;
};

/**
 * Menggabungkan berkas utama (`file`) dan daftar multi-berkas (`files`) milik satu pengumpulan
 * tanpa duplikasi, mempertahankan urutan `position` dan tetap kompatibel dengan data lama.
 */
export function filesOfSubmission<T extends { id: string }>(input: {
  file?: T | null;
  files?: { file: T }[];
}): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  if (input.files && input.files.length > 0) {
    for (const item of input.files) {
      if (!seen.has(item.file.id)) {
        seen.add(item.file.id);
        result.push(item.file);
      }
    }
  }
  if (input.file && !seen.has(input.file.id)) {
    result.unshift(input.file);
  }
  return result;
}

/** Parsing aman untuk JSON `RevisionRequest.focusPoints` (maks. 3 poin fokus perbaikan). */
export function parseRevisionFocusPoints(raw: unknown): RevisionFocusPoint[] {
  if (!Array.isArray(raw)) return [];
  const points: RevisionFocusPoint[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title) continue;
    const detail =
      typeof record.detail === "string" && record.detail.trim()
        ? record.detail.trim()
        : undefined;
    points.push(detail ? { title, detail } : { title });
    if (points.length >= 3) break;
  }
  return points;
}

/** Apakah batas waktu kirim ulang revisi sudah terlewat. */
export function isRevisionOverdue(
  dueAt: Date | null | undefined,
  now = new Date(),
): boolean {
  return Boolean(dueAt && dueAt < now);
}

/**
 * Memisahkan paragraf pengantar dan butir daftar ("- ", "• ", "* ", atau "1. ")
 * pada instruksi milestone agar UI dapat menampilkan kotak cek "Yang perlu ada pada hasil tugas".
 */
export function parseMilestoneInstructions(raw: string | null | undefined): {
  intro: string;
  checklist: string[];
} {
  if (!raw) return { intro: "", checklist: [] };
  const introLines: string[] = [];
  const checklist: string[] = [];
  const bulletPattern = /^(?:[-•*]|\d+[.)])\s+(.+)$/;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = bulletPattern.exec(trimmed);
    if (match?.[1]) {
      checklist.push(match[1].trim());
    } else {
      introLines.push(line);
    }
  }
  return {
    intro: introLines.join("\n").trim(),
    checklist,
  };
}
