import "server-only";

import type { Permission } from "@/lib/rbac";
import { requirePermission } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

type OrganizationAdminPermission = Extract<
  Permission,
  "member:manage" | "organization:update" | "trainer-request:review"
>;

/**
 * Admin Organisasi aktif beserta organisasinya. Semua aksi organisasi dibatasi ke `organizationId` ini,
 * jadi admin tidak pernah bisa mengubah data organisasi lain.
 */
export async function requireOrganizationAdmin(
  permission: OrganizationAdminPermission,
) {
  const user = await requirePermission(permission);
  const organizationId = user.membership!.organization.id;
  return { user, organizationId };
}

/** URL sementara logo organisasi, atau null jika tanpa logo (tampil inisial). */
export async function logoUrlOf(
  logo: { key: string; name: string; contentType: string } | null,
) {
  return logo ? createDownloadUrl(logo) : null;
}
