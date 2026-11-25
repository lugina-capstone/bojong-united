"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CircleHelpIcon, CompassIcon, ShieldCheckIcon } from "lucide-react";

import { BecraftLogo } from "@/components/brand/logo";
import {
  activeHref,
  navFor,
  type NavItem as NavItemData,
} from "@/components/layout/nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf, OrgLogo } from "@/components/ui/org-logo";
import { organizationAdminLabel, roleLabels, type Access } from "@/lib/rbac";

function NavItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItemData;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-lg px-3 text-body-medium text-label transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring",
        active &&
          "bg-primary-50 font-semibold text-primary-500 hover:bg-primary-50",
      )}
    >
      <Icon aria-hidden="true" className="size-4.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/** Kartu ruang di atas menu: ruang peserta, organisasi + ruang role, atau platform. */
function WorkspaceCard({
  access,
  workspace,
}: {
  access: Access;
  workspace: string;
}) {
  const staff = access.role !== "PESERTA" && access.role !== "ADMINISTRATOR";
  const title = staff
    ? workspace
    : access.role === "PESERTA"
      ? "Ruang Peserta"
      : roleLabels.ADMINISTRATOR;
  const subtitle = staff
    ? access.isOrganizationAdmin
      ? organizationAdminLabel
      : `Ruang ${roleLabels[access.role]}`
    : access.role === "ADMINISTRATOR"
      ? "Platform Becraft"
      : undefined;
  const Icon = access.role === "PESERTA" ? CompassIcon : ShieldCheckIcon;
  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-lg bg-muted p-3">
      {staff ? (
        <OrgLogo name={workspace} size="sm" />
      ) : (
        <Icon aria-hidden="true" className="size-5 shrink-0 text-primary-500" />
      )}
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-small-strong text-foreground">{title}</p>
        {subtitle && (
          <p className="truncate text-caption text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/** Isi sidebar; dipakai di sidebar desktop dan drawer mobile. */
function SidebarContent({
  access,
  workspace,
  user,
  onNavigate,
}: {
  access: Access;
  /** Nama organisasi di kartu atas, mis. "SMK Harapan Bangsa". */
  workspace: string;
  user: { name: string; roleLabel: string };
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = navFor(access);
  const current = activeHref(sections, pathname);
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-5">
      <Link
        href="/"
        aria-label="Becraft"
        className="flex h-10.5 shrink-0 items-center"
      >
        <BecraftLogo variant="sidebar" />
      </Link>
      <WorkspaceCard access={access} workspace={workspace} />
      <nav aria-label="Menu utama" className="flex flex-col gap-5">
        {sections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-overline text-subtle uppercase">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={item.href === current}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-auto flex shrink-0 flex-col gap-2">
        <a
          href="mailto:bantuan@becraft.id"
          className="flex h-11 items-center gap-3 rounded-lg px-3 text-body-medium text-label transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring"
        >
          <CircleHelpIcon aria-hidden="true" className="size-4.5 shrink-0" />
          Pusat bantuan
        </a>
        <div className="flex items-center gap-2.5 rounded-lg bg-muted p-3">
          <Avatar>
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-small-strong text-foreground">
              {user.name}
            </p>
            <p className="truncate text-caption text-muted-foreground">
              {user.roleLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sidebar tetap 240 px di layar ≥ 1024 px. */
function Sidebar(props: React.ComponentProps<typeof SidebarContent>) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card lg:block">
      <SidebarContent {...props} />
    </aside>
  );
}

export { Sidebar, SidebarContent, NavItem };
