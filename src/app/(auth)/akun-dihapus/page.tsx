import { CircleCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { buttonVariants } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";

export const metadata: Metadata = { title: "Akun dihapus" };

export default function AkunDihapusPage() {
  return (
    <AuthPanel>
      <AuthHeading
        icon={<IconBox icon={CircleCheckIcon} tone="success" size="lg" />}
        title="Akun berhasil dihapus"
        description="Profil, portofolio pribadi, dan riwayat belajar Anda sudah dihapus. Email Anda bisa dipakai lagi untuk mendaftar."
      />
      <Link href="/daftar" className={buttonVariants({ size: "lg" })}>
        Daftar akun baru
      </Link>
      <Link href="/" className="text-center text-small-strong text-primary-500">
        Kembali ke beranda
      </Link>
    </AuthPanel>
  );
}
