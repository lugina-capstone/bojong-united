"use client";

import { InfoIcon, MailCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  homeHref,
  resendOtpAction,
  verifyOtpAction,
} from "@/app/(auth)/actions";
import { AuthHeading } from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { OTP_LENGTH, OtpInput } from "@/components/ui/otp-input";
import { formatCountdown } from "@/lib/format";
import { OTP_RESEND_SECONDS, OTP_VALID_MINUTES } from "@/lib/otp";

const OTP_FOOTER =
  "Verifikasi dilakukan satu kali khusus pendaftaran manual tanpa Google.";
const OTP_ORGANIZATION_FOOTER =
  "Verifikasi email berlaku untuk semua pendaftaran manual: peserta dan organisasi.";

/** Langkah verifikasi email dengan kode 6 digit (AA-02). */
function OtpStep({
  email,
  onChangeEmail,
  onVerified,
  organization,
}: {
  email: string;
  /** Pendaftaran organisasi: "baru" mengirim pengajuan, "gabung" langsung aktif. */
  organization?: "baru" | "gabung";
  onChangeEmail?: () => void;
  /** Default: arahkan ke beranda sesuai role setelah sesi dibuat. */
  onVerified?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<{ code?: string; text?: string }>();
  const [notice, setNotice] = React.useState<string>();
  const [cooldown, setCooldown] = React.useState(OTP_RESEND_SECONDS);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function verify(code: string) {
    setError(undefined);
    startTransition(async () => {
      const result = await verifyOtpAction({ email, otp: code });
      if (!result.ok) {
        setError({
          code: result.code,
          text: result.error ?? result.fieldErrors?.otp,
        });
        return;
      }
      if (onVerified) await onVerified();
      else router.push(await homeHref());
    });
  }

  function resend() {
    setError(undefined);
    startTransition(async () => {
      const result = await resendOtpAction(email);
      if (result.ok) {
        setNotice("Kode baru sudah dikirim.");
        setOtp("");
        setCooldown(OTP_RESEND_SECONDS);
      } else setError({ text: result.error ?? result.fieldErrors?.email });
    });
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        verify(otp);
      }}
    >
      <AuthHeading
        icon={<IconBox icon={MailCheckIcon} tone="primary" size="lg" />}
        title="Verifikasi alamat email Anda"
        description={
          <>
            Masukkan kode {OTP_LENGTH} digit yang telah kami kirim ke{" "}
            <span className="text-body-strong text-foreground">{email}</span>
            {organization ? "." : " untuk mengaktifkan akun manual Anda."}
          </>
        }
      />
      {error &&
        (error.code === "INVALID_OTP" ? (
          <Alert tone="danger" title="Kode salah atau sudah kedaluwarsa">
            Periksa lagi, atau kirim ulang kode untuk mendapatkan kode baru yang
            berlaku {OTP_VALID_MINUTES} menit.
          </Alert>
        ) : (
          <Alert tone="danger">{error.text}</Alert>
        ))}
      <div className="flex flex-col gap-2">
        <span id="otp-label" className="text-small-strong text-label">
          Kode verifikasi ({OTP_LENGTH} digit)
          <span aria-hidden="true" className="ml-0.5 text-danger-500">
            *
          </span>
        </span>
        <OtpInput
          aria-labelledby="otp-label"
          value={otp}
          onChange={(value: string) => {
            setOtp(value);
            setError(undefined);
            if (value.length === OTP_LENGTH) verify(value);
          }}
          invalid={Boolean(error)}
          disabled={pending}
          autoFocus
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-small">
          {cooldown > 0 ? (
            <span className="text-muted-foreground">
              Kirim ulang kode dalam {formatCountdown(cooldown)}
            </span>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={pending}
              className="text-small-strong text-primary-500 hover:underline"
            >
              Kirim ulang kode
            </button>
          )}
          {onChangeEmail && (
            <button
              type="button"
              onClick={onChangeEmail}
              className="text-small-strong text-primary-500 hover:underline"
            >
              Ubah alamat email
            </button>
          )}
        </div>
        {notice && !error && (
          <p role="status" className="text-caption text-success-700">
            {notice}
          </p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={pending || otp.length < OTP_LENGTH}
      >
        {organization === "baru"
          ? "Verifikasi & kirim pengajuan"
          : "Verifikasi & lanjutkan"}
      </Button>
      {organization ? (
        <Alert tone="info">
          Organisasi baru: pengajuan dikirim ke Administrator setelah email
          terverifikasi. Gabung organisasi: akun langsung aktif sebagai anggota.
        </Alert>
      ) : (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-caption text-muted-foreground">
          <InfoIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          Belum menemukan email? Periksa folder Spam atau Promosi, atau pastikan
          penulisan email sudah benar.
        </p>
      )}
    </form>
  );
}

export { OTP_FOOTER, OTP_ORGANIZATION_FOOTER, OtpStep };
