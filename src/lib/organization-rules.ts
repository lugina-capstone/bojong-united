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

/** Jeda antar "Buat ulang kode", agar kode tidak diputar terus-menerus. */
export const CODE_COOLDOWN_MS = 60_000;

export function canRegenerateCode(codeCreatedAt: Date, now: Date): RuleResult {
  const wait = CODE_COOLDOWN_MS - (now.getTime() - codeCreatedAt.getTime());
  return wait > 0
    ? {
        allowed: false,
        reason: `Kode baru saja dibuat. Coba lagi dalam ${Math.ceil(wait / 1000)} detik.`,
      }
    : ok;
}

/** Tipe gambar dari byte awal berkas; tipe yang dilaporkan saat unggah tidak dipercaya. */
export function sniffImageType(head: Uint8Array) {
  const starts = (bytes: number[]) => bytes.every((b, i) => head[i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  return null;
}
