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
  it("memecah per baris, membuang baris kosong, dan tidak mengubah isi poin", () => {
    const parsed = parseOutcomes(
      " Hierarki visual\n\n-5 °C suhu simpan \n•OH radikal\n",
    );
    expect(parsed).toEqual([
      "Hierarki visual",
      "-5 °C suhu simpan",
      "•OH radikal",
    ]);
    expect(parseOutcomes(parsed.join("\n"))).toEqual(parsed);
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
