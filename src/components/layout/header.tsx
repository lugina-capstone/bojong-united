"use client";

import * as React from "react";
import { BellIcon, MenuIcon } from "lucide-react";

import { SidebarContent } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { initialsOf } from "@/components/ui/org-logo";
import { SearchInput } from "@/components/ui/search-input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { Access } from "@/lib/rbac";

/** Header sticky 80 px: tombol drawer (< 1024 px), breadcrumb, cari, notifikasi, menu akun. */
function Header({
  access,
  workspace,
  user,
  breadcrumb,
  searchPlaceholder = "Cari acara atau peserta…",
  notificationCount = 0,
  notifications,
  accountMenu,
}: {
  access: Access;
  workspace: string;
  user: { name: string; roleLabel: string };
  breadcrumb?: React.ReactNode;
  searchPlaceholder?: string;
  notificationCount?: number;
  /** Tombol + panel notifikasi; menggantikan lonceng statis `notificationCount`. */
  notifications?: React.ReactNode;
  /** Isi menu akun (MenuItem Profil, Keluar, dll.). */
  accountMenu?: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 sm:px-8 lg:h-20 lg:gap-4 lg:px-12">
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <IconButton
          label="Buka menu"
          className="lg:hidden"
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon />
        </IconButton>
        <SheetContent side="left" className="w-72 max-w-[85vw] p-0">
          <SheetTitle className="sr-only">Menu utama</SheetTitle>
          <SidebarContent
            access={access}
            workspace={workspace}
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1 truncate text-body text-muted-foreground">
        {breadcrumb}
      </div>
      <SearchInput
        aria-label="Cari"
        placeholder={searchPlaceholder}
        className="hidden w-65 md:block"
      />
      {notifications ?? (
        <div className="relative">
          <IconButton label="Notifikasi" className="border-transparent">
            <BellIcon />
          </IconButton>
          {notificationCount > 0 && (
            <span className="pointer-events-none absolute -top-1 -right-1 flex min-w-4.5 items-center justify-center rounded-full bg-danger-500 px-1 text-caption-strong text-inverse">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg p-1 outline-none focus-visible:shadow-focus-ring">
          <Avatar>
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col text-left sm:flex">
            <span className="truncate text-small-strong text-foreground">
              {user.name}
            </span>
            <span className="truncate text-caption text-muted-foreground">
              {user.roleLabel}
            </span>
          </span>
        </DropdownMenuTrigger>
        {accountMenu && (
          <DropdownMenuContent align="end" className="w-65">
            {accountMenu}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </header>
  );
}

export { Header };
