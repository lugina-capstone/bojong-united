import { describe, expect, it } from "vitest";

import { passwordChecks, passwordStrength } from "@/lib/password-strength";

describe("passwordStrength", () => {
  it("kosong bernilai 0 dan kata sandi pendek bernilai 1", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abc")).toBe(1);
  });

  it("naik satu tingkat per kriteria", () => {
    expect(passwordStrength("abcdefgh")).toBe(1);
    expect(passwordStrength("abcdefg1")).toBe(2);
    expect(passwordStrength("Abcdefg1")).toBe(3);
  });

  it("kuat jika semua kriteria terpenuhi dan panjang atau bersimbol", () => {
    expect(passwordStrength("Abcdefg1!")).toBe(4);
    expect(passwordStrength("Abcdefghijk1")).toBe(4);
  });

  it("melaporkan kriteria yang terpenuhi", () => {
    expect(passwordChecks("abcdefgh").map((check) => check.met)).toEqual([
      true,
      false,
      false,
    ]);
  });
});
