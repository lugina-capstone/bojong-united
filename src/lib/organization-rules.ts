/** Aturan pengelolaan anggota organisasi (PRD-05). Organisasi selalu punya minimal satu admin aktif. */

export type MemberTarget = { userId: string; isAdmin: boolean };

export type RuleResult = { allowed: true } | { allowed: false; reason: string };

const ok: RuleResult = { allowed: true };

export const LAST_ADMIN_REASON =
  "Organisasi minimal punya 1 admin. Jadikan anggota lain admin terlebih dahulu.";

export function canDemoteAdmin(
  target: MemberTarget,
  activeAdminCount: number,
): RuleResult {
  if (!target.isAdmin)
    return { allowed: false, reason: "Anggota ini bukan admin." };
  if (activeAdminCount <= 1)
    return { allowed: false, reason: LAST_ADMIN_REASON };
  return ok;
}

export function canPromoteAdmin(target: MemberTarget): RuleResult {
  return target.isAdmin
    ? { allowed: false, reason: "Anggota ini sudah admin." }
    : ok;
}

export function canRemoveMember(
  target: MemberTarget,
  actorId: string,
): RuleResult {
  if (target.userId === actorId)
    return {
      allowed: false,
      reason: "Gunakan Keluar dari organisasi untuk akun Anda sendiri.",
    };
  if (target.isAdmin)
    return {
      allowed: false,
      reason: "Admin harus diturunkan jadi anggota terlebih dahulu.",
    };
  return ok;
}

export function canLeaveOrganization(
  member: { isAdmin: boolean },
  activeAdminCount: number,
): RuleResult {
  if (member.isAdmin && activeAdminCount <= 1)
    return { allowed: false, reason: LAST_ADMIN_REASON };
  return ok;
}
