import { describe, expect, it } from "vitest";

import { hasPermission, resolveRole, rolePermissions } from "@/lib/rbac";

describe("rolePermissions", () => {
  it("memberi Guru dan Asesor izin yang sama", () => {
    expect(rolePermissions.ASESOR).toEqual(rolePermissions.GURU);
  });

  it("memberi Trainer semua izin Guru ditambah materi", () => {
    expect(rolePermissions.TRAINER).toEqual(
      expect.arrayContaining([...rolePermissions.GURU]),
    );
    expect(hasPermission("TRAINER", "material:manage")).toBe(true);
    expect(hasPermission("GURU", "material:manage")).toBe(false);
  });

  it("Admin Organisasi punya semua izin Trainer (termasuk Guru/Asesor)", () => {
    for (const permission of rolePermissions.TRAINER) {
      expect(hasPermission("ADMIN_ORGANISASI", permission)).toBe(true);
    }
  });

  it("hanya Admin Organisasi yang mengelola anggota", () => {
    expect(hasPermission("ADMIN_ORGANISASI", "member:manage")).toBe(true);
    expect(hasPermission("TRAINER", "member:manage")).toBe(false);
    expect(hasPermission("PESERTA", "member:manage")).toBe(false);
  });
});

describe("resolveRole", () => {
  const membership = (status: "PENDING" | "APPROVED" | "DISABLED") => ({
    role: "GURU" as const,
    organization: { status },
  });

  it("user tanpa membership adalah Peserta", () => {
    expect(resolveRole({ isAdministrator: false, membership: null })).toBe(
      "PESERTA",
    );
  });

  it("memakai peran membership jika organisasi disetujui", () => {
    expect(
      resolveRole({
        isAdministrator: false,
        membership: membership("APPROVED"),
      }),
    ).toBe("GURU");
  });

  it("menganggap anggota organisasi yang belum disetujui atau dinonaktifkan sebagai Peserta", () => {
    for (const status of ["PENDING", "DISABLED"] as const) {
      expect(
        resolveRole({ isAdministrator: false, membership: membership(status) }),
      ).toBe("PESERTA");
    }
  });

  it("Administrator selalu berperan Administrator", () => {
    expect(
      resolveRole({
        isAdministrator: true,
        membership: membership("APPROVED"),
      }),
    ).toBe("ADMINISTRATOR");
  });
});
