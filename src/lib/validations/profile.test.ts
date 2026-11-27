import { describe, expect, it } from "vitest";

import { changePasswordSchema, formatPhone, profileSchema } from "./profile";

describe("profileSchema", () => {
  it("menormalkan nomor HP dengan pemisah dan awalan +62", () => {
    expect(
      profileSchema.parse({ name: " Dimas ", phone: "+62 857-1122-0074" }),
    ).toEqual({ name: "Dimas", phone: "085711220074" });
  });

  it("menerima nomor HP kosong sebagai null", () => {
    expect(
      profileSchema.parse({ name: "Dimas", phone: "  " }).phone,
    ).toBeNull();
  });

  it("menolak nomor HP yang bukan nomor seluler Indonesia", () => {
    expect(
      profileSchema.safeParse({ name: "Dimas", phone: "0221234" }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ name: "Dimas", phone: "08abc1234567" }).success,
    ).toBe(false);
  });

  it("menolak nama kosong", () => {
    expect(profileSchema.safeParse({ name: " ", phone: "" }).success).toBe(
      false,
    );
  });

  it("menerima avatarFileId berupa id berkas atau null dan menolak string kosong", () => {
    expect(
      profileSchema.parse({
        name: "Dimas",
        phone: "",
        avatarFileId: "file_123",
      }).avatarFileId,
    ).toBe("file_123");
    expect(
      profileSchema.parse({ name: "Dimas", phone: "", avatarFileId: null })
        .avatarFileId,
    ).toBeNull();
    expect(
      profileSchema.safeParse({ name: "Dimas", phone: "", avatarFileId: "" })
        .success,
    ).toBe(false);
  });
});

describe("formatPhone", () => {
  it("mengelompokkan per empat angka", () => {
    expect(formatPhone("085711220074")).toBe("0857-1122-0074");
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "rahasia123",
    newPassword: "rahasia456",
    confirmPassword: "rahasia456",
  };

  it("menerima kata sandi baru yang valid", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak konfirmasi yang berbeda", () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, confirmPassword: "lain12345" })
        .success,
    ).toBe(false);
  });

  it("menolak kata sandi baru yang sama dengan yang lama", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "rahasia123",
        newPassword: "rahasia123",
        confirmPassword: "rahasia123",
      }).success,
    ).toBe(false);
  });
});
