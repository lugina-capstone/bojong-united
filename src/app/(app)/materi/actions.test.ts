import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  db: {
    material: { findFirst: vi.fn() },
    materialEnrollment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
  notify: vi.fn(),
}));

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/notifications", () => ({ notify: mocks.notify }));
vi.mock("@/lib/material-access", () => ({ visibleMaterialWhere: {} }));
vi.mock("@/lib/session", () => ({
  requirePermission: vi.fn(async () => ({ id: "peserta" })),
}));

import { enrollMaterialAction } from "@/app/(app)/materi/actions";

beforeEach(() => vi.clearAllMocks());

describe("enrollMaterialAction", () => {
  it("menganggap pendaftaran ganda yang bersamaan sebagai berhasil", async () => {
    mocks.db.material.findFirst.mockResolvedValue({
      id: "m",
      title: "Materi",
      trainerId: "trainer",
    });
    mocks.db.materialEnrollment.findUnique.mockResolvedValue(null);
    mocks.db.materialEnrollment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    expect(await enrollMaterialAction("m")).toEqual({ ok: true });
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("menolak materi yang tidak terlihat", async () => {
    mocks.db.material.findFirst.mockResolvedValue(null);
    expect(await enrollMaterialAction("m")).toEqual({
      error: "Materi tidak ditemukan.",
    });
    expect(mocks.db.materialEnrollment.create).not.toHaveBeenCalled();
  });
});
