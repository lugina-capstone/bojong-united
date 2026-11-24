import type {
  MemberRole,
  MembershipStatus,
  OrganizationStatus,
} from "@/generated/prisma/enums";

/** Peran efektif user. PESERTA = tanpa membership aktif, ADMINISTRATOR = admin platform. */
export type Role = "PESERTA" | MemberRole | "ADMINISTRATOR";

/**
 * Akses efektif user. Admin Organisasi bukan peran tersendiri, melainkan flag
 * `isOrganizationAdmin` di atas peran GURU, ASESOR, atau TRAINER.
 */
export type Access = { role: Role; isOrganizationAdmin: boolean };

export const roleLabels: Record<Role, string> = {
  PESERTA: "Peserta",
  GURU: "Guru",
  ASESOR: "Asesor",
  TRAINER: "Trainer",
  ADMINISTRATOR: "Administrator",
};

export const organizationAdminLabel = "Admin Organisasi";

const pesertaPermissions = [
  "event:join",
  "material:enroll",
  "organization:create",
  "organization:join",
] as const;

const pengajarPermissions = ["event:manage", "assessment:manage"] as const;

const guruPermissions = [
  ...pengajarPermissions,
  "trainer-request:create",
] as const;

const trainerPermissions = [...pengajarPermissions, "material:manage"] as const;

/** Ditambahkan ke izin peran jika `isOrganizationAdmin`. */
const organizationAdminPermissions = [
  "member:manage",
  "organization:update",
  "trainer-request:review",
] as const;

const administratorPermissions = [
  "organization:review",
  "organization:manage",
  "user:manage",
] as const;

export type Permission =
  | (typeof pesertaPermissions)[number]
  | (typeof guruPermissions)[number]
  | (typeof trainerPermissions)[number]
  | (typeof organizationAdminPermissions)[number]
  | (typeof administratorPermissions)[number];

export const rolePermissions: Record<Role, readonly Permission[]> = {
  PESERTA: pesertaPermissions,
  GURU: guruPermissions,
  ASESOR: guruPermissions,
  TRAINER: trainerPermissions,
  ADMINISTRATOR: administratorPermissions,
};

type AccessSource = {
  isAdministrator: boolean;
  membership: {
    role: MemberRole;
    isAdmin: boolean;
    status: MembershipStatus;
    organization: { status: OrganizationStatus };
  } | null;
};

/** Peran organisasi hanya berlaku untuk membership aktif di organisasi yang sudah disetujui. */
export function resolveAccess({
  isAdministrator,
  membership,
}: AccessSource): Access {
  if (isAdministrator) {
    return { role: "ADMINISTRATOR", isOrganizationAdmin: false };
  }
  if (
    membership?.status === "ACTIVE" &&
    membership.organization.status === "APPROVED"
  ) {
    return { role: membership.role, isOrganizationAdmin: membership.isAdmin };
  }
  return { role: "PESERTA", isOrganizationAdmin: false };
}

/** Izin efektif = izin peran + izin Admin Organisasi bila `isOrganizationAdmin`. */
export function permissionsOf({
  role,
  isOrganizationAdmin,
}: Access): readonly Permission[] {
  if (!isOrganizationAdmin) return rolePermissions[role];
  return [...rolePermissions[role], ...organizationAdminPermissions];
}

export function hasPermission(access: Access, permission: Permission): boolean {
  return permissionsOf(access).includes(permission);
}

/** Label untuk UI, mis. "Trainer · Admin Organisasi". */
export function accessLabel({ role, isOrganizationAdmin }: Access): string {
  return isOrganizationAdmin
    ? `${roleLabels[role]} · ${organizationAdminLabel}`
    : roleLabels[role];
}
