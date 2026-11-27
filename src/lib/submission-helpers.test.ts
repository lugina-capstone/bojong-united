import { describe, expect, it } from "vitest";

import {
  filesOfSubmission,
  isRevisionOverdue,
  MAX_SUBMISSION_FILES,
  parseMilestoneInstructions,
  parseRevisionFocusPoints,
} from "./submission-helpers";
import { revisionSchema, submissionSchema } from "./validations/event";

describe("filesOfSubmission", () => {
  const f1 = { id: "f1", name: "a.pdf" };
  const f2 = { id: "f2", name: "b.pdf" };

  it("mengembalikan berkas utama tunggal untuk data lama tanpa tabel submission_files", () => {
    expect(filesOfSubmission({ file: f1, files: [] })).toEqual([f1]);
  });

  it("menggabungkan berkas tanpa duplikasi dan menjaga urutan posisi", () => {
    expect(
      filesOfSubmission({ file: f1, files: [{ file: f1 }, { file: f2 }] }),
    ).toEqual([f1, f2]);
  });

  it("mengembalikan array kosong jika tidak ada berkas", () => {
    expect(filesOfSubmission({ file: null, files: [] })).toEqual([]);
  });
});

describe("parseRevisionFocusPoints", () => {
  it("mem-parsing hingga 3 butir fokus dan melewati item kosong", () => {
    const parsed = parseRevisionFocusPoints([
      { title: "  Tambahkan 3 temuan  ", detail: "Hubungkan dengan wawancara" },
      { title: "   " },
      { title: "Urutkan prioritas" },
      { title: "Lampirkan daftar pertanyaan" },
      { title: "Butir keempat yang dipotong" },
    ]);
    expect(parsed).toEqual([
      { title: "Tambahkan 3 temuan", detail: "Hubungkan dengan wawancara" },
      { title: "Urutkan prioritas" },
      { title: "Lampirkan daftar pertanyaan" },
    ]);
  });

  it("mengembalikan array kosong untuk nilai bukan array", () => {
    expect(parseRevisionFocusPoints(null)).toEqual([]);
    expect(parseRevisionFocusPoints("invalid")).toEqual([]);
  });
});

describe("isRevisionOverdue", () => {
  const now = new Date("2025-04-05T12:00:00Z");

  it("false saat batas revisi kosong atau masih di masa depan", () => {
    expect(isRevisionOverdue(null, now)).toBe(false);
    expect(isRevisionOverdue(new Date("2025-04-06T00:00:00Z"), now)).toBe(
      false,
    );
  });

  it("true saat batas revisi sudah terlewat", () => {
    expect(isRevisionOverdue(new Date("2025-04-05T11:59:00Z"), now)).toBe(true);
  });
});

describe("parseMilestoneInstructions", () => {
  it("memisahkan paragraf pengantar dan daftar poin bernomor atau bullet", () => {
    const parsed = parseMilestoneInstructions(
      "Wawancarai 5 pengguna kantin.\n- Daftar pertanyaan wawancara\n- Ringkasan jawaban\n3. Tiga temuan utama",
    );
    expect(parsed).toEqual({
      intro: "Wawancarai 5 pengguna kantin.",
      checklist: [
        "Daftar pertanyaan wawancara",
        "Ringkasan jawaban",
        "Tiga temuan utama",
      ],
    });
  });

  it("mengembalikan checklist kosong untuk teks paragraf biasa", () => {
    expect(parseMilestoneInstructions("Kerjakan sesuai rubrik.")).toEqual({
      intro: "Kerjakan sesuai rubrik.",
      checklist: [],
    });
  });
});

describe("submissionSchema dan revisionSchema (Tahap 2)", () => {
  it("menerima hingga 5 fileIds dan catatan revisi", () => {
    const parsed = submissionSchema.parse({
      fileIds: ["a", "b", "c", "d", "e"],
      revisionNote: "Sudah menambahkan 3 temuan utama.",
    });
    expect(parsed.fileIds).toHaveLength(MAX_SUBMISSION_FILES);
    expect(parsed.revisionNote).toBe("Sudah menambahkan 3 temuan utama.");
  });

  it("menolak lebih dari 5 fileIds", () => {
    const res = submissionSchema.safeParse({
      fileIds: ["1", "2", "3", "4", "5", "6"],
    });
    expect(res.success).toBe(false);
  });

  it("menerima revisionSchema dengan fokus perbaikan dan batas revisi opsional", () => {
    const legacy = revisionSchema.parse({
      note: "Perbaiki ringkasan hasil wawancara agar lebih fokus.",
    });
    expect(legacy.focusPoints).toEqual([]);
    expect(legacy.dueAt).toBeNull();

    const full = revisionSchema.parse({
      note: "Perbaiki ringkasan hasil wawancara agar lebih fokus.",
      focusPoints: [
        { title: "Tambahkan 3 temuan", detail: "Sertakan kutipan pengguna" },
      ],
      dueAt: "2026-12-01T16:59:00.000Z",
    });
    expect(full.focusPoints).toHaveLength(1);
    expect(full.dueAt).toBeInstanceOf(Date);
  });

  it("menolak lebih dari 3 fokus perbaikan pada revisionSchema", () => {
    const res = revisionSchema.safeParse({
      note: "Perbaiki ringkasan hasil wawancara agar lebih fokus.",
      focusPoints: [
        { title: "Satu" },
        { title: "Dua" },
        { title: "Tiga" },
        { title: "Empat" },
      ],
    });
    expect(res.success).toBe(false);
  });
});
