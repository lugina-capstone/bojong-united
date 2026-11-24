"use client";

import { MailCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  homeHref,
  resendOtpAction,
  verifyOtpAction,
} from "@/app/(auth)/actions";
import { AuthHeading } from "@/components/layout/auth-panel";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { OTP_LENGTH, OtpInput } from "@/components/ui/otp-input";
import { OTP_RESEND_SECONDS } from "@/lib/otp";

/** Langkah verifikasi email dengan kode 6 digit (AA-02). */
function OtpStep({
  email,
  onChangeEmail,
  onVerified,
}: {
  email: string;
  onChangeEmail?: () => void;
  /** Default: arahkan ke beranda sesuai role setelah sesi dibuat. */
  onVerified?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string>();
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
        setError(result.error ?? result.fieldErrors?.otp);
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
      } else setError(result.error ?? result.fieldErrors?.email);
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
        title="Cek email Anda"
        description={
          <>
            Kami mengirim kode {OTP_LENGTH} digit ke{" "}
            <span className="text-body-strong text-foreground">{email}</span>.
            Masukkan kode untuk memverifikasi email.
          </>
        }
      />
      <div className="flex flex-col gap-2">
        <OtpInput
          aria-label="Kode verifikasi"
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
        {error ? (
          <p role="alert" className="text-caption text-danger-500">
            {error}
          </p>
        ) : (
          notice && (
            <p role="status" className="text-caption text-success-700">
              {notice}
            </p>
          )
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={pending || otp.length < OTP_LENGTH}
      >
        Verifikasi
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-small">
        <span className="text-muted-foreground">
          Tidak menerima kode?{" "}
          {cooldown > 0 ? (
            <span>Kirim ulang dalam {cooldown} detik</span>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={pending}
              className="text-small-strong text-primary-500 hover:underline"
            >
              Kirim ulang
            </button>
          )}
        </span>
        {onChangeEmail && (
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-small-strong text-primary-500 hover:underline"
          >
            Ubah email
          </button>
        )}
      </div>
    </form>
  );
}

export { OtpStep };
