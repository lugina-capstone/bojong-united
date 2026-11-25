import type { CoverTone } from "@/components/ui/event-card";

export type SectionKind = "file" | "video" | "link" | "text";

export const sectionKindLabels: Record<SectionKind, string> = {
  file: "Berkas",
  video: "Video",
  link: "Tautan",
  text: "Teks bacaan",
};

/** Jenis bagian diturunkan dari isinya: video/berkas, tautan, atau teks bacaan. */
export function sectionKind(section: {
  fileContentType?: string | null;
  link?: string | null;
}): SectionKind {
  if (section.fileContentType) {
    return section.fileContentType.startsWith("video/") ? "video" : "file";
  }
  if (section.link) return "link";
  return "text";
}

/** Persentase bagian selesai, dibulatkan. */
export function materialProgress(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/** "± 45 menit" atau "± 1,5 jam" (dibulatkan per setengah jam). */
export function formatDuration(minutes: number) {
  if (minutes <= 0) return "–";
  if (minutes < 60) return `± ${minutes} menit`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `± ${String(hours).replace(".", ",")} jam`;
}

/** Materi yang sudah diikuti peserta diarsipkan, bukan dihapus. */
export function canDeleteMaterial(enrollmentCount: number) {
  return enrollmentCount === 0;
}

/** Notifikasi peserta baru ke Trainer dirangkum di tonggak tertentu. */
export function shouldNotifyEnrollment(count: number) {
  return [1, 5, 10, 25, 50].includes(count) || (count > 0 && count % 100 === 0);
}

export const materialLevelLabels = {
  BEGINNER: "Pemula",
  INTERMEDIATE: "Menengah",
  ADVANCED: "Lanjut",
} as const;

export const materialLevelHints = {
  BEGINNER: "Tanpa pengalaman",
  INTERMEDIATE: "Sudah paham dasar",
  ADVANCED: "Pendalaman topik",
} as const;

export const MATERIAL_COVERS = [
  "blue",
  "sage",
  "peach",
  "slate",
  "lilac",
  "sand",
] as const satisfies readonly CoverTone[];

/** Warna sampul tersimpan sebagai nama tone; nilai lama ("sky") dipetakan ke biru. */
export function materialCover(color: string): CoverTone {
  return (MATERIAL_COVERS as readonly string[]).includes(color)
    ? (color as CoverTone)
    : "blue";
}
