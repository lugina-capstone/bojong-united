import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE, uploadRequestSchema } from "@/lib/validations/file";

const pdf = { name: "Modul 1.PDF", contentType: "application/pdf", size: 1024 };

describe("uploadRequestSchema", () => {
  it("menerima file yang tipe dan ekstensinya sesuai", () => {
    expect(uploadRequestSchema.safeParse(pdf).success).toBe(true);
  });

  it("menerima file tepat 10 MB dan menolak yang lebih besar", () => {
    expect(
      uploadRequestSchema.safeParse({ ...pdf, size: MAX_FILE_SIZE }).success,
    ).toBe(true);
    expect(
      uploadRequestSchema.safeParse({ ...pdf, size: MAX_FILE_SIZE + 1 })
        .success,
    ).toBe(false);
  });

  it("menolak tipe yang tidak didukung", () => {
    const result = uploadRequestSchema.safeParse({
      name: "setup.exe",
      contentType: "application/x-msdownload",
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("menerima video MP4 untuk bagian materi", () => {
    const result = uploadRequestSchema.safeParse({
      name: "video.mp4",
      contentType: "video/mp4",
      size: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("menolak ekstensi yang tidak sesuai dengan tipe", () => {
    expect(
      uploadRequestSchema.safeParse({ ...pdf, name: "skrip.html" }).success,
    ).toBe(false);
    expect(
      uploadRequestSchema.safeParse({ ...pdf, name: "tanpa-ekstensi" }).success,
    ).toBe(false);
  });

  it("menolak file kosong", () => {
    expect(uploadRequestSchema.safeParse({ ...pdf, size: 0 }).success).toBe(
      false,
    );
  });
});
