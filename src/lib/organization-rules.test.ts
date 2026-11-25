import { describe, expect, it } from "vitest";

import {
  canDemoteAdmin,
  canRegenerateCode,
  canLeaveOrganization,
  canPromoteAdmin,
  canRemoveMember,
  LAST_ADMIN_REASON,
  sniffImageType,
} from "@/lib/organization-rules";

const admin = { userId: "a", isAdmin: true };
const member = { userId: "m", isAdmin: false };

describe("organization rules", () => {
  it("melarang menurunkan admin terakhir", () => {
    expect(canDemoteAdmin(admin, 1)).toEqual({
      allowed: false,
      reason: LAST_ADMIN_REASON,
    });
    expect(canDemoteAdmin(admin, 2)).toEqual({ allowed: true });
    expect(canDemoteAdmin(member, 2).allowed).toBe(false);
  });

  it("hanya anggota non-admin yang bisa dijadikan admin", () => {
    expect(canPromoteAdmin(member).allowed).toBe(true);
    expect(canPromoteAdmin(admin).allowed).toBe(false);
  });

  it("admin dan diri sendiri tidak bisa dikeluarkan", () => {
    expect(canRemoveMember(member, "a").allowed).toBe(true);
    expect(canRemoveMember(admin, "x").allowed).toBe(false);
    expect(canRemoveMember(member, "m").allowed).toBe(false);
  });

  it("admin terakhir tidak bisa keluar", () => {
    expect(canLeaveOrganization({ isAdmin: true }, 1).allowed).toBe(false);
    expect(canLeaveOrganization({ isAdmin: true }, 2).allowed).toBe(true);
    expect(canLeaveOrganization({ isAdmin: false }, 1).allowed).toBe(true);
  });

  it("memberi jeda 60 detik antar buat ulang kode", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    expect(
      canRegenerateCode(created, new Date("2026-01-01T00:00:30Z")),
    ).toEqual({
      allowed: false,
      reason: "Kode baru saja dibuat. Coba lagi dalam 30 detik.",
    });
    expect(
      canRegenerateCode(created, new Date("2026-01-01T00:01:00Z")).allowed,
    ).toBe(true);
  });

  it("mengenali PNG dan JPG dari isi berkas", () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0];
    expect(sniffImageType(Uint8Array.from(png))).toBe("image/png");
    expect(sniffImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
    expect(sniffImageType(new TextEncoder().encode("<svg onload=x>"))).toBe(
      null,
    );
    expect(sniffImageType(new Uint8Array())).toBe(null);
  });
});
