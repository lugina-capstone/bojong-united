import {
  CircleCheckIcon,
  MailIcon,
  PencilIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GoogleLogo } from "@/components/ui/google-button";
import { initialsOf } from "@/components/ui/org-logo";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/validations/profile";

import { CertificatePreview } from "./_components/certificate-preview";
import { DeleteAccountButton } from "./_components/delete-account-button";
import { ChangePasswordDialog } from "./_components/change-password-dialog";
import { loadParticipantProfile } from "./_components/load-profile";

export const metadata: Metadata = { title: "Profil" };

function InfoRow({
  label,
  value,
  note,
  badge,
}: {
  label: string;
  value: string;
  note: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-3">
      <dt className="flex items-center justify-between gap-2 text-caption text-muted-foreground">
        {label}
        {badge}
      </dt>
      <dd className="text-body-strong break-words text-foreground">{value}</dd>
      <dd className="text-caption text-muted-foreground">{note}</dd>
    </div>
  );
}

export default async function ParticipantProfilePage({
  searchParams,
}: PageProps<"/profil">) {
  const [profile, params] = await Promise.all([
    loadParticipantProfile(),
    searchParams,
  ]);
  const saved = params.tersimpan === "1";
  const phone = profile.phone ? formatPhone(profile.phone) : null;

  return (
    <div className="flex flex-col gap-6">
      {saved && (
        <Alert tone="success" title="Profil berhasil diperbarui!">
          Perubahan Anda telah tersimpan dan tampil di header aplikasi,
          portofolio, serta e-sertifikat acara mendatang.
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <nav
          className="text-small text-muted-foreground"
          aria-label="Breadcrumb"
        >
          Akun / Profil peserta
        </nav>
        <PageHeader
          title="Profil"
          description={
            profile.hasPassword
              ? "Kelola informasi umum, keamanan kata sandi, dan tampilan nama e-sertifikat."
              : "Kelola informasi umum dan tampilan nama e-sertifikat."
          }
          actions={
            <>
              {profile.hasPassword && (
                <ChangePasswordDialog placement="header" />
              )}
              <Link href="/profil/edit" className={buttonVariants()}>
                <PencilIcon aria-hidden="true" />
                Edit informasi
              </Link>
            </>
          }
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
            <span
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-500 text-h2 text-inverse"
            >
              {initialsOf(profile.name)}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-display break-words text-foreground">
                  {profile.name}
                </h2>
                <Badge tone="primary">Peserta</Badge>
                <Badge tone="neutral">
                  {profile.hasPassword ? "Akun manual" : "Akun Google"}
                </Badge>
                {saved && <Badge tone="success">Baru diperbarui</Badge>}
              </div>
              <span className="text-small break-all text-muted-foreground">
                {[profile.email, phone].filter(Boolean).join(" · ")}
              </span>
            </div>
          </section>
          <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-h2 text-foreground">Informasi umum akun</h2>
            <dl className="flex flex-col divide-y divide-border">
              <InfoRow
                label="Nama lengkap"
                value={profile.name}
                note="Dicantumkan pada portofolio pribadi dan e-sertifikat kelulusan acara."
              />
              <InfoRow
                label="Alamat email"
                value={profile.email}
                note={
                  profile.google
                    ? "Terhubung via Google."
                    : "Terdaftar manual dengan email dan kata sandi (tidak terhubung ke Google)."
                }
                badge={
                  profile.emailVerified && (
                    <Badge tone="success" size="sm">
                      <ShieldCheckIcon aria-hidden="true" />
                      Terverifikasi
                    </Badge>
                  )
                }
              />
              <InfoRow
                label="Nomor HP"
                value={phone ?? "Belum diisi"}
                note="Digunakan untuk koordinasi dan notifikasi kegiatan."
              />
              <InfoRow
                label="Peran"
                value="Peserta"
                note="Akun Anda terdaftar sebagai Peserta."
              />
            </dl>
          </section>
        </div>
        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-h3 text-foreground">Koneksi akun</h2>
            {profile.hasPassword && (
              <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-label">
                  <MailIcon aria-hidden="true" className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-small-strong text-foreground">
                    Email &amp; Kata Sandi
                  </span>
                  <span className="truncate text-caption text-muted-foreground">
                    {profile.email}
                  </span>
                </div>
                <Badge tone="success" size="sm">
                  <CircleCheckIcon aria-hidden="true" />
                  Aktif
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <GoogleLogo />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-small-strong text-foreground">
                  Google
                </span>
                <span className="truncate text-caption text-muted-foreground">
                  {profile.google ? profile.email : "Belum terhubung"}
                </span>
              </div>
              {profile.google && (
                <Badge tone="success" size="sm">
                  <CircleCheckIcon aria-hidden="true" />
                  Terhubung
                </Badge>
              )}
            </div>
            <dl className="flex flex-col gap-2 pt-1 text-small">
              <div className="flex justify-between gap-2">
                <dt className="text-label">Bergabung sejak</dt>
                <dd className="text-small-strong">
                  {formatDate(profile.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-label">Terakhir diperbarui</dt>
                <dd className="text-small-strong">
                  {formatDate(profile.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>
          {profile.hasPassword && (
            <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-h3 text-foreground">Keamanan kata sandi</h2>
              <p className="text-small text-muted-foreground">
                Akun terdaftar secara manual. Anda dapat mengganti kata sandi
                secara berkala untuk menjaga keamanan.
              </p>
              {profile.passwordChangedAt && (
                <div className="flex justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-small">
                  <span className="text-label">Kata sandi diubah</span>
                  <span className="text-small-strong">
                    {formatDate(profile.passwordChangedAt)}
                  </span>
                </div>
              )}
              <ChangePasswordDialog placement="card" />
            </section>
          )}
          <CertificatePreview
            title="Tampilan di e-sertifikat"
            name={profile.name}
          />
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-h3 text-foreground">Hapus akun</h2>
            <p className="text-small text-muted-foreground">
              Akun Peserta tidak bisa bergabung ke organisasi. Untuk mendaftar
              sebagai anggota atau organisasi baru dengan email ini, hapus akun
              ini terlebih dahulu.
            </p>
            <DeleteAccountButton email={profile.email} />
          </section>
        </aside>
      </div>
    </div>
  );
}
