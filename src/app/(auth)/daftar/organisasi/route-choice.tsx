"use client";

import {
  ArrowRightIcon,
  Building2Icon,
  CircleCheckIcon,
  ClockIcon,
  KeyRoundIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ROUTES: {
  value: "baru" | "gabung";
  title: string;
  description: string;
  icon: LucideIcon;
  badge: React.ReactNode;
}[] = [
  {
    value: "baru",
    title: "Organisasi baru",
    description:
      "Daftarkan sekolah, lembaga, atau perusahaan Anda. Anda menjadi Admin Organisasi setelah pengajuan disetujui Administrator.",
    icon: Building2Icon,
    badge: (
      <Badge tone="neutral">
        <ClockIcon aria-hidden="true" />
        Perlu persetujuan Administrator
      </Badge>
    ),
  },
  {
    value: "gabung",
    title: "Sudah punya organisasi",
    description:
      "Gabung memakai kode organisasi dari admin. Akun langsung aktif sebagai anggota setelah email terverifikasi.",
    icon: KeyRoundIcon,
    badge: (
      <Badge tone="success">
        <CircleCheckIcon aria-hidden="true" />
        Langsung aktif
      </Badge>
    ),
  },
];

function RouteChoice() {
  const router = useRouter();
  const [route, setRoute] = React.useState<"baru" | "gabung">("baru");
  return (
    <AuthPanel
      topStart={<BackLink href="/daftar">Kembali ke daftar peserta</BackLink>}
    >
      <AuthHeading
        title="Daftar sebagai organisasi"
        description="Akun organisasi dipakai guru, asesor, dan trainer untuk membuat acara dan menilai peserta. Pilih jalur yang sesuai."
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(`/daftar/organisasi/${route}`);
        }}
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Jalur pendaftaran</legend>
          {ROUTES.map(({ value, title, description, icon: Icon, badge }) => (
            <label
              key={value}
              className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted has-checked:border-primary-500 has-checked:bg-primary-50 has-focus-visible:shadow-focus-ring"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-label">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <span className="text-body-strong text-foreground">
                  {title}
                </span>
                <span className="text-small text-muted-foreground">
                  {description}
                </span>
                {badge}
              </span>
              <input
                type="radio"
                name="route"
                value={value}
                checked={route === value}
                onChange={() => setRoute(value)}
                className="mt-1 size-4 shrink-0 accent-primary-500"
              />
            </label>
          ))}
        </fieldset>
        <Alert tone="info">
          Satu email hanya untuk satu akun. Jika email Anda sudah terdaftar
          sebagai peserta, gunakan email lain (misalnya email institusi).
        </Alert>
        <Button type="submit" size="lg">
          Lanjutkan
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </form>
      <p className="text-center text-small text-muted-foreground">
        Sudah memiliki akun?{" "}
        <Link href="/masuk" className="text-small-strong text-primary-500">
          Masuk
        </Link>
      </p>
    </AuthPanel>
  );
}

export { RouteChoice };
