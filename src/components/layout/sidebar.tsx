"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { CircleHelpIcon, CompassIcon } from "lucide-react";

import { BecraftLogo } from "@/components/brand/logo";
import {
  activeHref,
  navFor,
  type NavItem as NavItemData,
} from "@/components/layout/nav";
import type { Access } from "@/lib/rbac";

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

/** Isi sidebar; dipakai di sidebar desktop dan drawer mobile. */
function SidebarContent({
  access,
  workspace,
  onNavigate,
}: {
  access: Access;
  /** Nama ruang/organisasi di kartu atas, mis. "SMK Lugina Rancaekek". */
  workspace: string;
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
      <div className="flex items-center gap-2.5 rounded-lg bg-muted p-3">
        <CompassIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-primary-500"
        />
        <p className="truncate text-small-strong text-foreground">
          {workspace}
        </p>
      </div>
      <nav aria-label="Menu utama" className="flex flex-col gap-5">
        {sections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-overline text-subtle">
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
      {access.role === "ADMINISTRATOR" && (
        <a
          href="mailto:bantuan@becraft.id"
          className="mt-auto flex h-11 items-center gap-3 rounded-lg px-3 text-body-medium text-label hover:bg-muted"
        >
          <CircleHelpIcon aria-hidden="true" className="size-4.5" />
          Pusat bantuan
        </a>
      )}
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
