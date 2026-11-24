import Link from "next/link";
import { CircleCheckIcon } from "lucide-react";

import { BecraftLogo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const HIGHLIGHTS = [
  "Ikuti acara dan kumpulkan karya per milestone",
  "Dapatkan nilai, umpan balik, dan sertifikat",
  "Bangun portofolio yang bisa dibagikan",
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-1 flex-col px-4 sm:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-border py-5">
        <BecraftLogo />
        <Link
          href="/masuk"
          className={buttonVariants({ variant: "secondary" })}
        >
          Masuk
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16 sm:py-24">
        <div className="flex max-w-2xl flex-col gap-5">
          <Badge tone="neutral" className="w-fit">
            SMK Lugina Rancaekek
          </Badge>
          <p className="text-overline text-subtle">Ruang tumbuh bersama</p>
          <h1 className="text-hero text-foreground sm:text-[56px] sm:leading-tight">
            Becraft
          </h1>
          <p className="text-h2 text-muted-foreground">
            Digital Portfolio &amp; Assessment System
          </p>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map((text) => (
              <li
                key={text}
                className="flex items-center gap-2.5 text-body text-label"
              >
                <CircleCheckIcon
                  aria-hidden="true"
                  className="size-4.5 shrink-0 text-success-500"
                />
                {text}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-3">
            <Link href="/daftar" className={buttonVariants({ size: "lg" })}>
              Daftar sekarang
            </Link>
            <Link
              href="/masuk"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Saya sudah punya akun
            </Link>
          </div>
        </div>
      </main>

      <footer className="flex flex-col gap-2 border-t border-border py-6 text-small text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Becraft</p>
        <p>Dikembangkan untuk SMK Lugina Rancaekek.</p>
      </footer>
    </div>
  );
}
