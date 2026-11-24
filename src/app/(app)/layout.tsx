import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { SignOutMenuItem } from "@/components/layout/sign-out-menu-item";
import { SkeletonDashboard } from "@/components/ui/skeleton-patterns";
import { destinationFor, destinationHref } from "@/lib/auth-routing";
import { accessLabel } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

async function AuthedShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const destination = destinationFor(user);
  if (destination.type !== "home") redirect(destinationHref(destination));
  const access = {
    role: user.role,
    isOrganizationAdmin: user.isOrganizationAdmin,
  };
  return (
    <AppShell
      access={access}
      workspace={user.membership?.organization.name ?? "Becraft"}
      user={{ name: user.name, roleLabel: accessLabel(access) }}
      accountMenu={<SignOutMenuItem />}
    >
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
          <SkeletonDashboard />
        </div>
      }
    >
      <AuthedShell>{children}</AuthedShell>
    </Suspense>
  );
}
