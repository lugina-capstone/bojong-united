"use client";

import * as React from "react";
import { BellIcon, ChevronDownIcon, MenuIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { activeHref, navFor } from "@/components/layout/nav";
import { SidebarContent } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

function searchTargetFor(access: Access) {
  if (access.role === "PESERTA") {
    return { href: "/jelajah", placeholder: "Cari acara atau materi…" };
  }
  if (access.role === "TRAINER") {
    return { href: "/ruang-kerja/materi", placeholder: "Cari materi…" };
  }
  if (access.role === "ADMINISTRATOR") {
    return { href: "/admin/organisasi", placeholder: "Cari organisasi…" };
  }
  return {
    href: "/ruang-kerja/acara",
    placeholder: "Cari acara atau peserta…",
  };
}

function HeaderSearch({
  href,
  placeholder,
}: {
  href: string;
  placeholder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [prevUrl, setPrevUrl] = React.useState(urlQuery);
  const [query, setQuery] = React.useState(urlQuery);

  if (urlQuery !== prevUrl) {
    setPrevUrl(urlQuery);
    setQuery(urlQuery);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `${href}?q=${encodeURIComponent(trimmed)}` : href);
  }

  return (
    <form onSubmit={submitSearch} className="hidden w-65 md:block">
      <SearchInput
        aria-label="Cari"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}

function subrouteBreadcrumb(pathname: string): string[] | null {
  if (pathname === "/profil/edit") {
    return ["Akun", "Profil", "Edit informasi"];
  }
  if (pathname.startsWith("/portofolio/")) {
    return ["Portofolio", "Detail karya"];
  }
  if (pathname === "/sertifikat" || pathname.startsWith("/sertifikat/")) {
    return ["Portofolio", "Sertifikat"];
  }
  if (pathname === "/materi" || pathname.startsWith("/materi/")) {
    return ["Portofolio", "Riwayat belajar"];
  }
  if (pathname.startsWith("/jelajah/materi/")) {
    return ["Jelajah", "Materi"];
  }
  return null;
}

/** Header sticky 80 px: tombol drawer (< 1024 px), breadcrumb, cari, notifikasi, menu akun. */
function Header({
  access,
  workspace,
  user,
  breadcrumb,
  searchPlaceholder,
  notificationCount = 0,
  notifications,
  accountMenu,
}: {
  access: Access;
  workspace: string;
  user: { name: string; roleLabel: string; avatarUrl?: string | null };
  breadcrumb?: React.ReactNode;
  searchPlaceholder?: string;
  notificationCount?: number;
  /** Tombol + panel notifikasi; menggantikan lonceng statis `notificationCount`. */
  notifications?: React.ReactNode;
  /** Isi menu akun (MenuItem Profil, Keluar, dll.). */
  accountMenu?: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();
  const sections = navFor(access);
  const current = activeHref(sections, pathname);
  const section = sections.find((s) => s.items.some((i) => i.href === current));
  const page = section?.items.find((i) => i.href === current);
  const crumbs =
    subrouteBreadcrumb(pathname) ??
    (section && page ? [section.label, page.label] : null);
  const searchTarget = searchTargetFor(access);
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
            user={user}
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1 truncate text-body text-muted-foreground">
        {breadcrumb ??
          (crumbs && (
            <nav aria-label="Breadcrumb">
              {crumbs.map((part, idx) => (
                <React.Fragment key={`${part}-${idx}`}>
                  {idx > 0 && (
                    <span aria-hidden="true" className="mx-2">
                      /
                    </span>
                  )}
                  <span
                    className={
                      idx === crumbs.length - 1 ? "text-foreground" : undefined
                    }
                  >
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          ))}
      </div>
      <React.Suspense
        fallback={
          <SearchInput
            aria-label="Cari"
            placeholder={searchPlaceholder ?? searchTarget.placeholder}
            className="hidden w-65 md:block"
          />
        }
      >
        <HeaderSearch
          href={searchTarget.href}
          placeholder={searchPlaceholder ?? searchTarget.placeholder}
        />
      </React.Suspense>
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
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            )}
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
          <ChevronDownIcon
            aria-hidden="true"
            className="hidden size-4 shrink-0 text-muted-foreground sm:block"
          />
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
