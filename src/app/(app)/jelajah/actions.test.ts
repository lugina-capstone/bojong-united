import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    enrollment: { count: vi.fn(), create: vi.fn() },
    teamInvite: { count: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  };
  return {
    tx,
    db: {
      team: { findFirst: vi.fn() },
      user: { findFirst: vi.fn(), findMany: vi.fn() },
      teamInvite: { findFirst: vi.fn(), update: vi.fn() },
      $transaction: vi.fn((run: (client: typeof tx) => unknown) => run(tx)),
    },
    notify: vi.fn(),
  };
});

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/notifications", () => ({ notify: mocks.notify }));
vi.mock("@/lib/participant-access", () => ({
  requireParticipant: vi.fn(async () => ({ id: "me", name: "Saya" })),
  hasStarted: vi.fn(() => false),
}));

import {
  inviteTeamMemberAction,
  respondInviteAction,
  searchInviteesAction,
} from "@/app/(app)/jelajah/actions";

const team = {
  id: "tim",
  name: "Tim A",
  eventId: "acara",
  leaderId: "ketua",
  event: { title: "Acara", status: "PUBLISHED", maxTeamMembers: 3 },
  _count: { members: 2 },
};

beforeEach(() => vi.clearAllMocks());

describe("searchInviteesAction", () => {
  it("menyamarkan email hasil pencarian", async () => {
    mocks.db.team.findFirst.mockResolvedValue(team);
    mocks.db.user.findMany.mockResolvedValue([
      {
        id: "u1",
        name: "Dimas",
        email: "dimas@gmail.com",
        enrollments: [],
        teamInvitesReceived: [],
      },
    ]);
    const result = await searchInviteesAction("tim", "dim");
    expect(result).toEqual([
      { id: "u1", name: "Dimas", email: "di***@gmail.com", state: "available" },
    ]);
  });
});

describe("inviteTeamMemberAction", () => {
  beforeEach(() => {
    mocks.db.team.findFirst.mockResolvedValue(team);
    mocks.db.user.findFirst.mockResolvedValue({ id: "u1" });
  });

  it("menolak undangan ganda di dalam transaksi", async () => {
    mocks.tx.enrollment.count.mockResolvedValue(0);
    mocks.tx.teamInvite.count.mockResolvedValue(1);
    const result = await inviteTeamMemberAction("tim", "u1");
    expect(result.error).toBe("Peserta ini sudah diundang.");
    expect(mocks.tx.teamInvite.create).not.toHaveBeenCalled();
    expect(mocks.db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("mengembalikan pesan biasa saat transaksi bentrok", async () => {
    const { Prisma } = await import("@/generated/prisma/client");
    mocks.db.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("konflik", {
        code: "P2034",
        clientVersion: "x",
      }),
    );
    const result = await inviteTeamMemberAction("tim", "u1");
    expect(result.error).toMatch(/Coba lagi/);
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});

describe("respondInviteAction", () => {
  beforeEach(() =>
    mocks.db.teamInvite.findFirst.mockResolvedValue({ id: "inv", team }),
  );

  it("menolak saat slot tim sudah penuh di dalam transaksi", async () => {
    mocks.tx.enrollment.count.mockResolvedValue(3);
    const result = await respondInviteAction("inv", true);
    expect(result.error).toBe("Slot anggota tim sudah penuh.");
    expect(mocks.tx.enrollment.create).not.toHaveBeenCalled();
  });

  it("menolak undangan yang sudah diproses permintaan lain", async () => {
    mocks.tx.enrollment.count.mockResolvedValue(2);
    mocks.tx.teamInvite.updateMany.mockResolvedValue({ count: 0 });
    const result = await respondInviteAction("inv", true);
    expect(result.error).toBe("Undangan sudah tidak berlaku.");
    expect(mocks.tx.enrollment.create).not.toHaveBeenCalled();
  });

  it("menerima undangan selama slot masih ada", async () => {
    mocks.tx.enrollment.count.mockResolvedValue(2);
    mocks.tx.teamInvite.updateMany.mockResolvedValue({ count: 1 });
    const result = await respondInviteAction("inv", true);
    expect(result.ok).toBe(true);
    expect(mocks.tx.enrollment.create).toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalled();
  });
});
