import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    material: { deleteMany: vi.fn() },
    materialEnrollment: { count: vi.fn() },
    materialSection: { findMany: vi.fn() },
    file: { findMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/notifications", () => ({ notify: vi.fn() }));
vi.mock("@/lib/storage", () => ({ deleteObject: vi.fn() }));
vi.mock("@/lib/material-access", () => ({
  requireTrainer: vi.fn(),
  requireOwnMaterial: vi.fn(async (id: string) => ({ material: { id } })),
}));

import { deleteMaterialAction } from "@/app/(app)/ruang-kerja/materi/actions";

beforeEach(() => vi.clearAllMocks());

describe("deleteMaterialAction", () => {
  it("menghapus hanya jika belum ada peserta saat penghapusan", async () => {
    mocks.db.materialEnrollment.count.mockResolvedValue(0);
    mocks.db.materialSection.findMany.mockResolvedValue([]);
    mocks.db.material.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteMaterialAction("m")).toEqual({ ok: true });
    expect(mocks.db.material.deleteMany).toHaveBeenCalledWith({
      where: { id: "m", enrollments: { none: {} } },
    });
  });

  it("menyarankan arsip jika peserta mendaftar tepat sebelum dihapus", async () => {
    mocks.db.materialEnrollment.count.mockResolvedValue(0);
    mocks.db.materialSection.findMany.mockResolvedValue([]);
    mocks.db.material.deleteMany.mockResolvedValue({ count: 0 });
    const result = await deleteMaterialAction("m");
    expect(result.archiveSuggested).toBe(true);
    expect(mocks.db.file.findMany).not.toHaveBeenCalled();
  });
});
