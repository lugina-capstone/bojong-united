import Link from "next/link";

import { BecraftLogo } from "@/components/brand/logo";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-1 flex-col px-4 sm:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-border py-5">
        <Link href="/" aria-label="Beranda Becraft">
          <BecraftLogo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col py-10 sm:py-14">{children}</main>
    </div>
  );
}
