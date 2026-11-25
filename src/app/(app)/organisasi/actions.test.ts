import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    trainerRequest: { updateMany: vi.fn() },
    membership: { updateMany: vi.fn() },
  };
  return {
    tx,
    db: {
      organization: {
        findUniqueOrThrow: vi.fn(),
        updateMany: vi.fn(),
        update: vi.fn(),
      },
      file: { findFirst: vi.fn() },
      trainerRequest: { findFirst: vi.fn() },
      membership: { findFirst: vi.fn() },
      $transaction: vi.fn((run: (client: typeof tx) => unknown) => run(tx)),
    },
    notify: vi.fn(),
    sendNoticeEmail: vi.fn(),
    readObjectHead: vi.fn(),
  };
});

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/notifications", () => ({
  notify: mocks.notify,
  notifyOrganizationAdmins: vi.fn(),
}));
vi.mock("@/lib/organization-access", () => ({
  requireOrganizationAdmin: vi.fn(async () => ({
    user: { id: "admin" },
    organizationId: "org",
  })),
}));
vi.mock("@/lib/organization-email", () => ({
  sendNoticeEmail: mocks.sendNoticeEmail,
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(),
  readObjectHead: mocks.readObjectHead,
}));

import {
  regenerateOrganizationCodeAction,
  reviewTrainerRequestAction,
  updateOrganizationLogoAction,
} from "@/app/(app)/organisasi/actions";

beforeEach(() => vi.clearAllMocks());

describe("regenerateOrganizationCodeAction", () => {
  it("menolak selama jeda 60 detik", async () => {
    mocks.db.organization.findUniqueOrThrow.mockResolvedValue({
      codeCreatedAt: new Date(),
    });
    const result = await regenerateOrganizationCodeAction();
    expect(result.error).toMatch(/Coba lagi dalam/);
    expect(mocks.db.organization.updateMany).not.toHaveBeenCalled();
  });

  it("mengganti kode setelah jeda, bersyarat pada kode yang dibaca", async () => {
    const codeCreatedAt = new Date(Date.now() - 61_000);
    mocks.db.organization.findUniqueOrThrow.mockResolvedValue({
      codeCreatedAt,
    });
    mocks.db.organization.updateMany.mockResolvedValue({ count: 1 });
    const result = await regenerateOrganizationCodeAction();
    expect(result.ok).toBe(true);
    expect(result.code).toBeTruthy();
    expect(mocks.db.organization.updateMany.mock.calls[0]?.[0].where).toEqual({
      id: "org",
      codeCreatedAt,
    });
  });

  it("menolak permintaan kedua yang bersamaan", async () => {
    mocks.db.organization.findUniqueOrThrow.mockResolvedValue({
      codeCreatedAt: new Date(Date.now() - 61_000),
    });
    mocks.db.organization.updateMany.mockResolvedValue({ count: 0 });
    const result = await regenerateOrganizationCodeAction();
    expect(result).toEqual({
      error: "Kode baru saja dibuat. Muat ulang halaman.",
    });
  });
});

describe("updateOrganizationLogoAction", () => {
  it("menolak berkas yang isinya bukan PNG/JPG", async () => {
    mocks.db.file.findFirst.mockResolvedValue({
      key: "k",
      size: 100,
      contentType: "image/png",
    });
    mocks.readObjectHead.mockResolvedValue(new TextEncoder().encode("<svg on"));
    const result = await updateOrganizationLogoAction("file");
    expect(result).toEqual({ error: "Logo harus PNG/JPG, maks. 2 MB." });
    expect(mocks.db.organization.update).not.toHaveBeenCalled();
  });
});

describe("reviewTrainerRequestAction", () => {
  it("menolak keputusan kedua tanpa mengirim notifikasi atau email", async () => {
    mocks.db.trainerRequest.findFirst.mockResolvedValue({
      id: "req",
      userId: "u",
      user: { name: "Andi", email: "andi@example.test" },
      organization: { name: "SMK" },
    });
    mocks.db.membership.findFirst.mockResolvedValue({ id: "m" });
    mocks.tx.trainerRequest.updateMany.mockResolvedValue({ count: 0 });
    const result = await reviewTrainerRequestAction("req", "approve");
    expect(result).toEqual({ error: "Pengajuan sudah ditinjau." });
    expect(mocks.tx.membership.updateMany).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.sendNoticeEmail).not.toHaveBeenCalled();
  });
});
