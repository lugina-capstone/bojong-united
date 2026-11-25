import {
  BookOpenIcon,
  Building2Icon,
  CalendarDaysIcon,
  ChartLineIcon,
  ClipboardCheckIcon,
  CompassIcon,
  FolderOpenIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MessagesSquareIcon,
  PanelsTopLeftIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import type { Access } from "@/lib/rbac";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { label: string; items: NavItem[] };

const PESERTA_NAV: NavSection[] = [
  {
    label: "Ruang belajar",
    items: [
      { label: "Jelajah", href: "/jelajah", icon: CompassIcon },
      { label: "Beranda", href: "/beranda", icon: LayoutDashboardIcon },
      { label: "Portofolio", href: "/portofolio", icon: FolderOpenIcon },
    ],
  },
  {
    label: "Akun",
    items: [
      { label: "Profil", href: "/profil", icon: UserRoundIcon },
      { label: "Pengaturan", href: "/pengaturan", icon: Settings2Icon },
    ],
  },
];

const ADMINISTRATOR_NAV: NavSection[] = [
  {
    label: "Administrasi",
    items: [
      { label: "Beranda", href: "/admin", icon: LayoutDashboardIcon },
      {
        label: "Persetujuan",
        href: "/admin/persetujuan",
        icon: ShieldCheckIcon,
      },
      { label: "Organisasi", href: "/admin/organisasi", icon: Building2Icon },
      { label: "Pengguna", href: "/admin/pengguna", icon: UsersIcon },
    ],
  },
];

const ORGANIZATION_SECTION: NavSection = {
  label: "Organisasi",
  items: [
    { label: "Beranda Organisasi", href: "/organisasi", icon: LandmarkIcon },
    {
      label: "Profil organisasi",
      href: "/organisasi/profil",
      icon: Building2Icon,
    },
    { label: "Anggota", href: "/organisasi/anggota", icon: UsersIcon },
    {
      label: "Acara organisasi",
      href: "/organisasi/acara",
      icon: CalendarDaysIcon,
    },
  ],
};

function workspaceNav(isTrainer: boolean): NavSection {
  return {
    label: "Ruang kerja",
    items: [
      { label: "Beranda", href: "/ruang-kerja", icon: LayoutDashboardIcon },
      {
        label: "Acara Saya",
        href: "/ruang-kerja/acara",
        icon: CalendarDaysIcon,
      },
      ...(isTrainer
        ? [{ label: "Materi", href: "/ruang-kerja/materi", icon: BookOpenIcon }]
        : []),
      { label: "Peserta Acara", href: "/ruang-kerja/peserta", icon: UsersIcon },
      {
        label: "Tugas & Penilaian",
        href: "/ruang-kerja/tugas",
        icon: ClipboardCheckIcon,
      },
      { label: "Laporan", href: "/ruang-kerja/laporan", icon: ChartLineIcon },
    ],
  };
}

const LIBRARY_SECTION: NavSection = {
  label: "Pustaka",
  items: [
    {
      label: "Galeri Karya",
      href: "/ruang-kerja/galeri",
      icon: PanelsTopLeftIcon,
    },
    {
      label: "Rubrik Penilaian",
      href: "/ruang-kerja/rubrik",
      icon: ListChecksIcon,
    },
    {
      label: "Survei",
      href: "/ruang-kerja/survei",
      icon: MessagesSquareIcon,
    },
  ],
};

/** Menu sidebar sesuai Figma: Peserta, Guru/Asesor, Trainer, Admin Organisasi, Administrator. */
function navFor({ role, isOrganizationAdmin }: Access): NavSection[] {
  if (role === "PESERTA") return PESERTA_NAV;
  if (role === "ADMINISTRATOR") return ADMINISTRATOR_NAV;
  return [
    workspaceNav(role === "TRAINER"),
    LIBRARY_SECTION,
    ...(isOrganizationAdmin ? [ORGANIZATION_SECTION] : []),
    {
      label: "Akun",
      items: [
        { label: "Profil", href: "/ruang-kerja/profil", icon: UserRoundIcon },
      ],
    },
  ];
}

/** Item aktif = href terpanjang yang menjadi awalan pathname. */
function activeHref(sections: NavSection[], pathname: string) {
  return sections
    .flatMap((section) => section.items.map((item) => item.href))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

export { navFor, activeHref, type NavItem, type NavSection };
