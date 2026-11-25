import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    organization: { findUnique: vi.fn(), create: vi.fn() },
    membership: { deleteMany: vi.fn(), create: vi.fn() },
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
  joinOrganizationAction,
} from "@/app/(auth)/actions";

beforeEach(() => vi.clearAllMocks());

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
