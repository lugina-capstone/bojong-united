import { redirect } from "next/navigation";

import { destinationFor, destinationHref } from "@/lib/auth-routing";
import type { Role } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

/** Beranda hanya untuk role-nya; role lain diarahkan ke beranda masing-masing. */
export async function requireHomeRole(roles: readonly Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role))
    redirect(destinationHref(destinationFor(user)));
  return user;
}
