"use client";

import { MailCheckIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { type FormState, forgotPasswordAction } from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";
import { InputWithIcon } from "@/components/ui/input";
import { OTP_RESEND_SECONDS, RESET_LINK_MINUTES } from "@/lib/otp";
import { formatCountdown } from "@/lib/format";

const FOOTER =
  "Tautan atur ulang hanya dapat digunakan satu kali demi keamanan akun Anda.";

/** Minta tautan atur ulang. `expired`: dibuka dari tautan yang kedaluwarsa atau sudah dipakai. */
function ForgotPasswordForm({ expired = false }: { expired?: boolean }) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<FormState>({});
  const [cooldown, setCooldown] = React.useState(0);
  const [pending, startTransition] = React.useTransition();
  const error = state.fieldErrors?.email ?? state.error;
  const back = <BackLink href="/masuk">Kembali ke halaman masuk</BackLink>;
  const googleInfo = (
    <Alert tone="info" title="Daftar menggunakan akun Google?">
      Akun Google tidak memerlukan kata sandi Becraft. Silakan kembali ke
      halaman masuk dan pilih Masuk dengan Google.
    </Alert>
  );
  const signInPrompt = (
    <p className="text-center text-small text-muted-foreground">
      Ingat kata sandi Anda?{" "}
      <Link href="/masuk" className="text-small-strong text-primary-500">
        Masuk sekarang
      </Link>
    </p>
  );

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function submit() {
    startTransition(async () => {
      const result = await forgotPasswordAction({ email });
      if (result.ok) setCooldown(OTP_RESEND_SECONDS);
      // Kirim ulang yang ditolak tetap di layar "Cek email Anda".
      setState((previous) =>
        previous.ok && !result.ok
          ? { ...previous, error: result.error }
          : result,
      );
    });
  }

  if (state.ok) {
    return (
      <AuthPanel topStart={back} footer={FOOTER}>
        <AuthHeading
          icon={<IconBox icon={MailCheckIcon} tone="primary" size="lg" />}
          title="Cek email Anda"
          description={
            <>
              Jika{" "}
              <span className="text-body-strong text-foreground">
                {state.email}
              </span>{" "}
              terdaftar, kami sudah mengirim tautan untuk membuat kata sandi
              baru. Tautan berlaku {RESET_LINK_MINUTES} menit.
            </>
          }
        />
        <Link href="/masuk" className={buttonVariants({ size: "lg" })}>
          Kembali ke halaman masuk
        </Link>
        <p className="text-center text-small text-muted-foreground">
          Belum menerima email? Periksa folder Spam, atau{" "}
          {cooldown > 0 ? (
            `kirim ulang dalam ${formatCountdown(cooldown)}.`
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="text-small-strong text-primary-500 hover:underline"
            >
              kirim ulang tautan
            </button>
          )}
        </p>
        {state.error && (
          <p role="alert" className="text-center text-small text-danger-500">
            {state.error}
          </p>
        )}
        {googleInfo}
        {signInPrompt}
      </AuthPanel>
    );
  }

  return (
    <AuthPanel topStart={back} footer={FOOTER}>
      {expired ? (
        <>
          <AuthHeading
            title="Tautan sudah kedaluwarsa"
            description={`Tautan atur ulang hanya berlaku ${RESET_LINK_MINUTES} menit dan sekali pakai. Masukkan email untuk meminta tautan baru.`}
          />
          <Alert tone="danger" title="Tautan tidak dapat digunakan">
            Tautan sudah melewati {RESET_LINK_MINUTES} menit atau sudah pernah
            dipakai.
          </Alert>
        </>
      ) : (
        <AuthHeading
          title="Lupa kata sandi?"
          description={`Masukkan alamat email akun Anda. Kami akan mengirimkan tautan atur ulang kata sandi yang berlaku selama ${RESET_LINK_MINUTES} menit.`}
        />
      )}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <FormField
          id="email"
          label="Alamat email terdaftar"
          required
          error={error}
        >
          <InputWithIcon
            id="email"
            type="email"
            icon={MailIcon}
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={fieldDescribedBy("email", { error })}
          />
        </FormField>
        <Button type="submit" size="lg" disabled={pending}>
          {expired ? "Kirim tautan baru" : "Kirim tautan atur ulang"}
        </Button>
      </form>
      {googleInfo}
      {signInPrompt}
    </AuthPanel>
  );
}

export { ForgotPasswordForm };
