import type { MemberRole, OrganizationStatus } from "@/generated/prisma/enums";

/** Peran efektif user. PESERTA = tanpa membership aktif, ADMINISTRATOR = admin platform. */
export type Role = "PESERTA" | MemberRole | "ADMINISTRATOR";

export const roleLabels: Record<Role, string> = {
  PESERTA: "Peserta",
  GURU: "Guru",
  ASESOR: "Asesor",
  TRAINER: "Trainer",
  ADMIN_ORGANISASI: "Admin Organisasi",
  ADMINISTRATOR: "Administrator",
};

const pesertaPermissions = [
  "event:join",
  "material:enroll",
  "organization:create",
  "organization:join",
] as const;

const pengajarPermissions = ["event:manage", "assessment:manage"] as const;

const trainerPermissions = [...pengajarPermissions, "material:manage"] as const;

const adminOrganisasiPermissions = [
  "member:manage",
  "organization:update",
] as const;

const administratorPermissions = [
  "organization:review",
  "organization:manage",
  "user:manage",
] as const;

export type Permission =
  | (typeof pesertaPermissions)[number]
  | (typeof trainerPermissions)[number]
  | (typeof adminOrganisasiPermissions)[number]
  | (typeof administratorPermissions)[number];

export const rolePermissions: Record<Role, readonly Permission[]> = {
  PESERTA: pesertaPermissions,
  GURU: pengajarPermissions,
  ASESOR: pengajarPermissions,
  TRAINER: trainerPermissions,
  ADMIN_ORGANISASI: adminOrganisasiPermissions,
  ADMINISTRATOR: administratorPermissions,
};

type RoleSource = {
  isAdministrator: boolean;
  membership: {
    role: MemberRole;
    organization: { status: OrganizationStatus };
  } | null;
};

/** Peran organisasi hanya berlaku jika organisasinya sudah disetujui. */
export function resolveRole({ isAdministrator, membership }: RoleSource): Role {
  if (isAdministrator) return "ADMINISTRATOR";
  if (membership?.organization.status === "APPROVED") return membership.role;
  return "PESERTA";
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
