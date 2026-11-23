import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission, resolveRole, type Permission } from "@/lib/rbac";

/**
 * User yang sedang login beserta peran efektifnya, atau null.
 * Membership dibaca dari database di setiap request agar perubahan peran langsung berlaku.
 * Membaca header request, jadi komponen pemanggilnya harus berada di dalam <Suspense>.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdministrator: true,
      membership: {
        select: {
          role: true,
          organization: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });
  if (!user) return null;

  return { ...user, role: resolveRole(user) };
});

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  return user;
}

/** Untuk page dan Server Action. Route Handler sebaiknya memakai `hasPermission` dan membalas 403. */
export async function requirePermission(
  permission: Permission,
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) notFound();
  return user;
}
