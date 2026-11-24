import { describe, expect, it } from "vitest";

import {
  accessLabel,
  hasPermission,
  permissionsOf,
  resolveAccess,
  rolePermissions,
  type Access,
  type Role,
} from "@/lib/rbac";

const access = (role: Role, isOrganizationAdmin = false): Access => ({
  role,
  isOrganizationAdmin,
});

describe("rolePermissions", () => {
  it("memberi Guru dan Asesor izin yang sama", () => {
    expect(rolePermissions.ASESOR).toEqual(rolePermissions.GURU);
  });

  it("memberi Trainer izin Guru (kecuali pengajuan Trainer) ditambah materi", () => {
    for (const permission of rolePermissions.GURU) {
      if (permission === "trainer-request:create") continue;
      expect(hasPermission(access("TRAINER"), permission)).toBe(true);
    }
    expect(hasPermission(access("TRAINER"), "material:manage")).toBe(true);
    expect(hasPermission(access("GURU"), "material:manage")).toBe(false);
  });

  it("hanya Guru dan Asesor yang bisa mengajukan akses Trainer", () => {
    expect(hasPermission(access("GURU"), "trainer-request:create")).toBe(true);
    expect(hasPermission(access("ASESOR"), "trainer-request:create")).toBe(
      true,
    );
    expect(hasPermission(access("TRAINER"), "trainer-request:create")).toBe(
      false,
    );
    expect(hasPermission(access("PESERTA"), "trainer-request:create")).toBe(
      false,
    );
  });
});

describe("Admin Organisasi (isOrganizationAdmin)", () => {
  it("izin efektif = izin peran + izin admin", () => {
    for (const role of ["GURU", "ASESOR", "TRAINER"] as const) {
      const permissions = permissionsOf(access(role, true));
      expect(permissions).toEqual(
        expect.arrayContaining([...rolePermissions[role]]),
      );
      expect(permissions).toEqual(
        expect.arrayContaining([
          "member:manage",
          "organization:update",
          "trainer-request:review",
        ]),
      );
    }
  });

  it("admin dengan peran Guru tidak otomatis mengelola materi", () => {
    expect(hasPermission(access("GURU", true), "material:manage")).toBe(false);
    expect(hasPermission(access("TRAINER", true), "material:manage")).toBe(
      true,
    );
  });

  it("hanya admin yang mengelola anggota", () => {
    expect(hasPermission(access("TRAINER", true), "member:manage")).toBe(true);
    expect(hasPermission(access("TRAINER"), "member:manage")).toBe(false);
    expect(hasPermission(access("PESERTA"), "member:manage")).toBe(false);
  });

  it("label menggabungkan peran dan Admin Organisasi", () => {
    expect(accessLabel(access("GURU", true))).toBe("Guru · Admin Organisasi");
    expect(accessLabel(access("ASESOR"))).toBe("Asesor");
  });
});

describe("resolveAccess", () => {
  const membership = ({
    organizationStatus = "APPROVED",
    status = "ACTIVE",
    isAdmin = false,
  }: {
    organizationStatus?: "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";
    status?: "ACTIVE" | "REMOVED";
    isAdmin?: boolean;
  } = {}) => ({
    role: "GURU" as const,
    isAdmin,
    status,
    organization: { status: organizationStatus },
  });

  it("user tanpa membership adalah Peserta", () => {
    expect(resolveAccess({ isAdministrator: false, membership: null })).toEqual(
      access("PESERTA"),
    );
  });

  it("memakai peran dan flag admin membership aktif di organisasi yang disetujui", () => {
    expect(
      resolveAccess({ isAdministrator: false, membership: membership() }),
    ).toEqual(access("GURU"));
    expect(
      resolveAccess({
        isAdministrator: false,
        membership: membership({ isAdmin: true }),
      }),
    ).toEqual(access("GURU", true));
  });

  it("anggota organisasi yang belum disetujui, ditolak, atau dinonaktifkan dianggap Peserta", () => {
    for (const organizationStatus of [
      "PENDING",
      "REJECTED",
      "DISABLED",
    ] as const) {
      expect(
        resolveAccess({
          isAdministrator: false,
          membership: membership({ organizationStatus, isAdmin: true }),
        }),
      ).toEqual(access("PESERTA"));
    }
  });

  it("anggota yang dikeluarkan dianggap Peserta", () => {
    expect(
      resolveAccess({
        isAdministrator: false,
        membership: membership({ status: "REMOVED", isAdmin: true }),
      }),
    ).toEqual(access("PESERTA"));
  });

  it("Administrator selalu berperan Administrator", () => {
    expect(
      resolveAccess({
        isAdministrator: true,
        membership: membership({ isAdmin: true }),
      }),
    ).toEqual(access("ADMINISTRATOR"));
  });
});
