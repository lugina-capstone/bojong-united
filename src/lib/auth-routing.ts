import type {
  MembershipStatus,
  OrganizationStatus,
} from "@/generated/prisma/enums";

export type AccountState = {
  isAdministrator: boolean;
  membership: {
    status: MembershipStatus;
    organization: { status: OrganizationStatus };
  } | null;
};

/** Layar status di halaman Masuk untuk akun yang belum atau tidak bisa masuk ruang kerja. */
export type LoginStatus = "menunggu" | "ditolak" | "nonaktif";

export type Destination =
  | { type: "home"; href: "/admin" | "/ruang-kerja" | "/beranda" }
  | { type: "removed"; href: "/dikeluarkan" }
  | { type: "status"; status: LoginStatus };

/** Tujuan setelah masuk sesuai role dan status akun (PRD-01 §5). */
export function destinationFor(account: AccountState): Destination {
  if (account.isAdministrator) return { type: "home", href: "/admin" };
  const membership = account.membership;
  if (!membership) return { type: "home", href: "/beranda" };
  if (membership.status === "REMOVED")
    return { type: "removed", href: "/dikeluarkan" };
  switch (membership.organization.status) {
    case "APPROVED":
      return { type: "home", href: "/ruang-kerja" };
    case "PENDING":
      return { type: "status", status: "menunggu" };
    case "REJECTED":
      return { type: "status", status: "ditolak" };
    case "DISABLED":
      return { type: "status", status: "nonaktif" };
  }
}

export function destinationHref(destination: Destination) {
  return destination.type === "status"
    ? `/masuk?status=${destination.status}`
    : destination.href;
}
