import { CircleCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { buttonVariants } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";

export const metadata: Metadata = { title: "Akun dihapus" };

export default function AkunDihapusPage() {
  return (
    <AuthPanel
      topStart={<BackLink href="/masuk">Kembali ke halaman masuk</BackLink>}
      footer="Terima kasih telah menggunakan Becraft."
    >
      <AuthHeading
        icon={<IconBox icon={CircleCheckIcon} tone="success" size="lg" />}
        title="Akun Anda sudah dihapus"
        description="Akun Anda beserta profil, sertifikat, dan portofolio pribadinya sudah dihapus. Email Anda dapat dipakai lagi untuk mendaftar akun baru."
      />
      <Link href="/masuk" className={buttonVariants({ size: "lg" })}>
        Kembali ke halaman masuk
      </Link>
      <p className="text-center text-body text-muted-foreground">
        Ingin memakai Becraft lagi?{" "}
        <Link
          href="/daftar"
          className="text-body-strong text-primary-500 hover:underline"
        >
          Daftar akun baru
        </Link>
      </p>
    </AuthPanel>
  );
}
