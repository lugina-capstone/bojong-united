import { describe, expect, it } from "vitest";

import { matchesFileSignature } from "./file";

const bytes = (...values: number[]) => Uint8Array.from(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("matchesFileSignature", () => {
  it("menerima isi yang cocok dengan tipenya", () => {
    expect(matchesFileSignature("application/pdf", text("%PDF-1.7"))).toBe(
      true,
    );
    expect(matchesFileSignature("image/jpeg", bytes(0xff, 0xd8, 0xff))).toBe(
      true,
    );
    expect(
      matchesFileSignature(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        bytes(0x50, 0x4b, 0x03, 0x04),
      ),
    ).toBe(true);
    expect(
      matchesFileSignature("video/mp4", bytes(0, 0, 0, 0x18, ...text("ftyp"))),
    ).toBe(true);
  });

  it("menolak isi yang tidak cocok, kosong, atau tipe tak dikenal", () => {
    expect(matchesFileSignature("application/pdf", text("<html>"))).toBe(false);
    expect(matchesFileSignature("image/png", bytes(0xff, 0xd8, 0xff))).toBe(
      false,
    );
    expect(matchesFileSignature("video/mp4", text("ftyp"))).toBe(false);
    expect(matchesFileSignature("application/pdf", bytes())).toBe(false);
    expect(matchesFileSignature("text/html", text("%PDF-"))).toBe(false);
  });
});
