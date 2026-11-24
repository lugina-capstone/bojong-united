import Image from "next/image";

import { BecraftLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

import visual from "../../../public/images/akses-akun-visual.webp";

/**
 * Kerangka layar Akses Akun: visual Becraft di kiri (≥ 1024 px) dan formulir di kanan.
 * `topStart` untuk tautan kembali atau label layar, `topEnd` untuk penanda langkah.
 */
function AuthPanel({
  topStart,
  topEnd,
  footer = "Data profil bersifat umum dan digunakan untuk kegiatan pembelajaran di Becraft.",
  className,
  children,
}: {
  topStart?: React.ReactNode;
  topEnd?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-card">
      <div className="relative hidden w-[41.6%] shrink-0 p-6 pr-0 lg:block">
        <div className="sticky top-6 h-[calc(100dvh-3rem)]">
          <div className="relative size-full overflow-hidden rounded-4xl border border-primary-100">
            <Image
              src={visual}
              alt=""
              priority
              fill
              sizes="42vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-8 lg:px-12 lg:py-7">
        <div className="flex min-h-7 items-center justify-between gap-3">
          <div>{topStart}</div>
          <div>{topEnd}</div>
        </div>
        <main className="flex flex-1 items-center justify-center py-8">
          <div
            className={cn("flex w-full max-w-114 flex-col gap-5", className)}
          >
            <div className="flex items-center gap-2.5">
              <BecraftLogo className="[&_svg]:h-7 [&>svg:first-child]:size-7" />
              <span aria-hidden="true" className="text-caption text-subtle">
                ·
              </span>
              <span className="text-caption text-subtle">
                Ruang tumbuh bersama
              </span>
            </div>
            {children}
          </div>
        </main>
        {footer && (
          <p className="text-center text-caption text-subtle">{footer}</p>
        )}
      </div>
    </div>
  );
}

/** Judul dan deskripsi layar Akses Akun. */
function AuthHeading({
  title,
  description,
  icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {icon}
      <h1 className="text-h2 text-foreground lg:text-display">{title}</h1>
      {description && (
        <p className="text-body text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/** Label layar kecil di pojok kiri atas, mis. "Masuk akun". */
function AuthTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-primary-50 px-2 py-1 text-caption-strong text-primary-500">
      {children}
    </span>
  );
}

/** Pemisah "atau" di antara tombol utama dan tombol Google. */
function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-caption text-subtle">
      <span className="h-px flex-1 bg-border" />
      atau
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export { AuthDivider, AuthHeading, AuthPanel, AuthTag };
