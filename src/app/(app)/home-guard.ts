import { redirect } from "next/navigation";

import { destinationFor, destinationHref } from "@/lib/auth-routing";
import type { Role } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

/** Hanya untuk role-nya dan akun yang boleh masuk ruang; selain itu diarahkan ke tujuan akunnya. */
export async function requireHomeRole(roles: readonly Role[]) {
  const user = await requireUser();
  const destination = destinationFor(user);
  if (destination.type !== "home" || !roles.includes(user.role))
    redirect(destinationHref(destination));
  return user;
}
