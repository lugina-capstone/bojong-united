import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    organization: { findUnique: vi.fn(), create: vi.fn() },
    membership: { deleteMany: vi.fn(), create: vi.fn() },
    materialEnrollment: { deleteMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    session: { deleteMany: vi.fn() },
    account: { deleteMany: vi.fn() },
    teamInvite: { updateMany: vi.fn() },
    certificate: { deleteMany: vi.fn() },
    user: { update: vi.fn() },
    enrollment: { count: vi.fn() },
    $transaction: vi.fn(),
  },
  requireUser: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: {} } }));
vi.mock("@/lib/auth-rate-limit", () => ({ limitAuthAction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/notifications", () => ({
  notifyAdministrators: vi.fn(),
  notifyOrganizationAdmins: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/storage", () => ({}));

import {
  createOrganizationAction,
  deleteAccountAction,
  joinOrganizationAction,
} from "@/app/(auth)/actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.$transaction.mockImplementation(
    (run: (tx: typeof mocks.db) => unknown) => run(mocks.db),
  );
  mocks.db.enrollment.count.mockResolvedValue(0);
});

describe("akun Peserta tanpa riwayat organisasi", () => {
  beforeEach(() =>
    mocks.requireUser.mockResolvedValue({
      id: "peserta",
      email: "p@x.id",
      membership: null,
    }),
  );

  it("tidak bisa bergabung dengan kode organisasi", async () => {
    const result = await joinOrganizationAction("ABC123");
    expect(result?.error).toMatch(/Akun Peserta tidak bisa bergabung/);
    expect(mocks.db.organization.findUnique).not.toHaveBeenCalled();
    expect(mocks.db.membership.create).not.toHaveBeenCalled();
    expect(mocks.db.membership.deleteMany).not.toHaveBeenCalled();
  });

  it("tidak bisa mendaftarkan organisasi baru", async () => {
    const result = await createOrganizationAction({});
    expect(result?.error).toMatch(/Akun Peserta tidak bisa bergabung/);
    expect(mocks.db.membership.deleteMany).not.toHaveBeenCalled();
  });
});

describe("akun yang masih aktif di organisasi", () => {
  it("tetap ditolak", async () => {
    mocks.requireUser.mockResolvedValue({
      id: "guru",
      membership: { status: "ACTIVE" },
    });
    const result = await joinOrganizationAction("ABC123");
    expect(result?.error).toBe("Akun ini masih tergabung di organisasi.");
  });
});

describe("deleteAccountAction", () => {
  const input = { email: "p@x.id", confirmed: true };

  it("mengizinkan Peserta menghapus akunnya dan melepas emailnya", async () => {
    mocks.requireUser.mockResolvedValue({
      id: "peserta",
      email: "p@x.id",
      isAdministrator: false,
      membership: null,
    });
    await deleteAccountAction(input);
    expect(mocks.db.$transaction).toHaveBeenCalled();
    expect(mocks.db.certificate.deleteMany).toHaveBeenCalledWith({
      where: { enrollment: { userId: "peserta" } },
    });
    expect(mocks.db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "DELETED",
          email: "deleted+peserta@becraft.invalid",
        }),
      }),
    );
  });

  it("menolak Peserta yang masih terdaftar di acara yang belum selesai", async () => {
    mocks.requireUser.mockResolvedValue({
      id: "peserta",
      email: "p@x.id",
      isAdministrator: false,
      membership: null,
    });
    mocks.db.enrollment.count.mockResolvedValue(1);
    expect((await deleteAccountAction(input))?.error).toMatch(/belum selesai/);
    expect(mocks.db.enrollment.count).toHaveBeenCalledWith({
      where: {
        userId: "peserta",
        event: expect.objectContaining({ status: "PUBLISHED" }),
      },
    });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it("menolak anggota organisasi aktif dan Administrator", async () => {
    mocks.requireUser.mockResolvedValue({
      id: "guru",
      email: "p@x.id",
      isAdministrator: false,
      membership: { status: "ACTIVE" },
    });
    expect((await deleteAccountAction(input))?.error).toMatch(/Hapus akun/);
    mocks.requireUser.mockResolvedValue({
      id: "admin",
      email: "p@x.id",
      isAdministrator: true,
      membership: null,
    });
    expect((await deleteAccountAction(input))?.error).toMatch(/Hapus akun/);
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
});
