import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    subjectField: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    event: { count: vi.fn() },
    rubric: { count: vi.fn() },
  },
  user: { id: "guru", membership: { isAdmin: false } },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/teacher-access", () => ({
  requireTeacher: vi.fn(async () => ({
    user: mocks.user,
    organizationId: "org",
  })),
}));

import { Prisma } from "@/generated/prisma/client";

import {
  createSubjectFieldAction,
  deleteSubjectFieldAction,
  renameSubjectFieldAction,
} from "@/app/(app)/ruang-kerja/subject-field-actions";

const uniqueViolation = new Prisma.PrismaClientKnownRequestError("unique", {
  code: "P2002",
  clientVersion: "test",
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.membership.isAdmin = false;
  mocks.db.event.count.mockResolvedValue(0);
  mocks.db.rubric.count.mockResolvedValue(0);
});

describe("createSubjectFieldAction", () => {
  it("memakai bidang yang sudah ada walau beda huruf besar/kecil", async () => {
    mocks.db.subjectField.findFirst.mockResolvedValue({
      id: "f1",
      name: "Fotografi",
    });
    const result = await createSubjectFieldAction("fotografi");
    expect(result).toEqual({ ok: true, fieldId: "f1", name: "Fotografi" });
    expect(
      mocks.db.subjectField.findFirst.mock.calls[0]![0].where.name,
    ).toEqual({ equals: "fotografi", mode: "insensitive" });
    expect(mocks.db.subjectField.create).not.toHaveBeenCalled();
  });

  it("memakai bidang pemenang saat dua permintaan bersamaan", async () => {
    mocks.db.subjectField.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "f1", name: "Fotografi" });
    mocks.db.subjectField.create.mockRejectedValue(uniqueViolation);
    const result = await createSubjectFieldAction("FOTOGRAFI");
    expect(result).toEqual({ ok: true, fieldId: "f1", name: "Fotografi" });
  });
});

describe("renameSubjectFieldAction", () => {
  it("menolak bidang bawaan atau milik organisasi lain", async () => {
    mocks.db.subjectField.findFirst.mockResolvedValue(null);
    const result = await renameSubjectFieldAction("field_uiux", "Desain");
    expect(result.error).toBe("Bidang tidak ditemukan.");
    expect(mocks.db.subjectField.findFirst.mock.calls[0]![0].where).toEqual({
      id: "field_uiux",
      organizationId: "org",
    });
    expect(mocks.db.subjectField.update).not.toHaveBeenCalled();
  });

  it("menolak pengajar biasa bila bidang sudah dipakai", async () => {
    mocks.db.subjectField.findFirst.mockResolvedValue({ id: "f1" });
    mocks.db.rubric.count.mockResolvedValue(1);
    const result = await renameSubjectFieldAction("f1", "Foto");
    expect(result.error).toContain("Hanya Admin Organisasi");
    expect(mocks.db.subjectField.update).not.toHaveBeenCalled();
  });

  it("mengizinkan Admin Organisasi mengubah bidang yang dipakai", async () => {
    mocks.user.membership.isAdmin = true;
    mocks.db.subjectField.findFirst
      .mockResolvedValueOnce({ id: "f1" })
      .mockResolvedValueOnce(null);
    mocks.db.rubric.count.mockResolvedValue(1);
    const result = await renameSubjectFieldAction("f1", "Foto");
    expect(result).toEqual({ ok: true, fieldId: "f1", name: "Foto" });
  });

  it("menolak nama yang sama dengan bidang lain", async () => {
    mocks.db.subjectField.findFirst
      .mockResolvedValueOnce({ id: "f1" })
      .mockResolvedValueOnce({ id: "field_poster", name: "Poster" });
    const result = await renameSubjectFieldAction("f1", "poster");
    expect(result.error).toBe("Bidang dengan nama itu sudah ada.");
  });

  it("mengizinkan mengubah huruf besar/kecil bidang itu sendiri", async () => {
    mocks.db.subjectField.findFirst
      .mockResolvedValueOnce({ id: "f1" })
      .mockResolvedValueOnce({ id: "f1", name: "fotografi" });
    const result = await renameSubjectFieldAction("f1", "Fotografi");
    expect(result.ok).toBe(true);
  });
});

describe("deleteSubjectFieldAction", () => {
  it("hanya menghapus bidang organisasi yang tidak dipakai", async () => {
    mocks.db.subjectField.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteSubjectFieldAction("f1")).toEqual({
      ok: true,
      fieldId: "f1",
    });
    expect(mocks.db.subjectField.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "f1",
        organizationId: "org",
        events: { none: {} },
        rubrics: { none: {} },
      },
    });
  });

  it("menjelaskan bila bidang masih dipakai", async () => {
    mocks.db.subjectField.deleteMany.mockResolvedValue({ count: 0 });
    mocks.db.subjectField.findFirst.mockResolvedValue({ id: "f1" });
    const result = await deleteSubjectFieldAction("f1");
    expect(result.error).toContain("masih dipakai");
  });
});
