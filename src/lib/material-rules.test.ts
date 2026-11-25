import { describe, expect, it } from "vitest";

import {
  canDeleteMaterial,
  formatDuration,
  materialCover,
  materialProgress,
  sectionKind,
  shouldNotifyEnrollment,
} from "@/lib/material-rules";

describe("material rules", () => {
  it("menghitung progres dari bagian selesai", () => {
    expect(materialProgress(0, 6)).toBe(0);
    expect(materialProgress(2, 6)).toBe(33);
    expect(materialProgress(6, 6)).toBe(100);
    expect(materialProgress(3, 0)).toBe(0);
  });

  it("jenis bagian dari isi", () => {
    expect(sectionKind({ fileContentType: "video/mp4" })).toBe("video");
    expect(sectionKind({ fileContentType: "application/pdf" })).toBe("file");
    expect(sectionKind({ link: "https://example.com" })).toBe("link");
    expect(sectionKind({})).toBe("text");
  });

  it("materi yang sudah diikuti tidak bisa dihapus", () => {
    expect(canDeleteMaterial(0)).toBe(true);
    expect(canDeleteMaterial(1)).toBe(false);
  });

  it("format durasi dan sampul", () => {
    expect(formatDuration(45)).toBe("± 45 menit");
    expect(formatDuration(90)).toBe("± 1,5 jam");
    expect(formatDuration(120)).toBe("± 2 jam");
    expect(materialCover("sky")).toBe("blue");
    expect(materialCover("sage")).toBe("sage");
  });

  it("notifikasi peserta dirangkum", () => {
    expect(shouldNotifyEnrollment(1)).toBe(true);
    expect(shouldNotifyEnrollment(3)).toBe(false);
    expect(shouldNotifyEnrollment(200)).toBe(true);
  });
});
