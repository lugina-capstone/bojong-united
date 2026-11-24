import { describe, expect, it } from "vitest";

import { signUpSchema } from "@/lib/validations/auth";

describe("signUpSchema", () => {
  it("menormalkan email ke huruf kecil", () => {
    const result = signUpSchema.parse({
      name: "Budi",
      email: "  Budi@Contoh.ID ",
      password: "rahasia123",
      terms: true,
    });
    expect(result.email).toBe("budi@contoh.id");
  });

  it("menolak password kurang dari 8 karakter", () => {
    const result = signUpSchema.safeParse({
      name: "Budi",
      email: "budi@contoh.id",
      password: "pendek",
      terms: true,
    });
    expect(result.success).toBe(false);
  });
});
