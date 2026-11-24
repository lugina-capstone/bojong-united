import { describe, expect, it } from "vitest";

import {
  canDemoteAdmin,
  canLeaveOrganization,
  canPromoteAdmin,
  canRemoveMember,
  LAST_ADMIN_REASON,
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
});
