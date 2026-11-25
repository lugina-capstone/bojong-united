import { describe, expect, it } from "vitest";

import { materialInfoSchema, parseOutcomes } from "@/lib/validations/material";

const info = {
  title: "Dasar Tipografi",
  description: "Memilih dan memadukan huruf.",
  categoryId: "kategori",
  level: "BEGINNER",
  coverColor: "blue",
};

describe("outcomes materi", () => {
  it("memecah per baris dan membuang tanda daftar serta baris kosong", () => {
    expect(parseOutcomes("- Hierarki visual\n\n• Warna & kontras \n")).toEqual([
      "Hierarki visual",
      "Warna & kontras",
    ]);
  });

  it("opsional", () => {
    expect(materialInfoSchema.parse(info).outcomes).toEqual([]);
  });

  it("menolak lebih dari 6 poin dan poin terlalu pendek", () => {
    const many = Array.from({ length: 7 }, (_, i) => `Poin ke-${i}`).join("\n");
    expect(
      materialInfoSchema.safeParse({ ...info, outcomes: many }).success,
    ).toBe(false);
    expect(
      materialInfoSchema.safeParse({ ...info, outcomes: "ab" }).success,
    ).toBe(false);
  });
});
