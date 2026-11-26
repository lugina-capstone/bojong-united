import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    rubric: {
      findFirst: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subjectField: { findFirst: vi.fn() },
    rubricCriterion: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
  user: { id: "guru-b", membership: { isAdmin: false } },
}));

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/teacher-access", () => ({
  requireTeacher: vi.fn(async () => ({
    user: mocks.user,
    organizationId: "org",
  })),
}));

import {
  deleteRubricAction,
  updateRubricAction,
} from "@/app/(app)/ruang-kerja/rubrik/actions";

const input = {
  title: "Rubrik desain",
  description: "",
  fieldId: "bidang",
  criteria: [
    {
      name: "Kerapian",
      description: "",
      level1: "aa",
      level2: "bb",
      level3: "cc",
      level4: "dd",
      level5: "ee",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "guru-b", membership: { isAdmin: false } };
});

describe("rubrik milik pengajar lain", () => {
  beforeEach(() =>
    mocks.db.rubric.findFirst.mockResolvedValue({
      id: "r1",
      creatorId: "guru-a",
      _count: { milestones: 0 },
    }),
  );

  it("tidak bisa diubah", async () => {
    const result = await updateRubricAction("r1", input);
    expect(result.error).toMatch(/Hanya pembuat rubrik/);
    expect(mocks.db.rubric.create).not.toHaveBeenCalled();
    expect(mocks.db.rubric.update).not.toHaveBeenCalled();
  });

  it("tidak bisa dihapus", async () => {
    const result = await deleteRubricAction("r1");
    expect(result.error).toMatch(/Hanya pembuat rubrik/);
    expect(mocks.db.rubric.delete).not.toHaveBeenCalled();
    expect(mocks.db.rubric.update).not.toHaveBeenCalled();
  });

  it("bisa dihapus Admin Organisasi", async () => {
    mocks.user = { id: "admin", membership: { isAdmin: true } };
    const result = await deleteRubricAction("r1");
    expect(result.ok).toBe(true);
    expect(mocks.db.rubric.delete).toHaveBeenCalled();
  });
});

describe("rubrik yang dipakai acara terbit", () => {
  it("disimpan sebagai versi baru, bukan diubah di tempat", async () => {
    mocks.user = { id: "guru-a", membership: { isAdmin: false } };
    mocks.db.rubric.findFirst.mockResolvedValue({
      id: "r1",
      creatorId: "guru-a",
      version: 1,
    });
    mocks.db.subjectField.findFirst.mockResolvedValue({ id: "bidang" });
    mocks.db.rubric.count.mockResolvedValue(1);
    // Versi 2 sudah ada, jadi salinan dari versi 1 harus menjadi versi 3.
    mocks.db.rubric.aggregate.mockResolvedValue({ _max: { version: 2 } });
    mocks.db.rubric.create.mockResolvedValue({ id: "r3" });
    const result = await updateRubricAction("r1", input);
    expect(result.rubricId).toBe("r3");
    expect(mocks.db.rubric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 3, sourceRubricId: "r1" }),
      }),
    );
    expect(mocks.db.rubric.update).not.toHaveBeenCalled();
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
});
