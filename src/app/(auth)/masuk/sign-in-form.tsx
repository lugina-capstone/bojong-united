"use client";

import { MailIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackButton } from "@/app/(auth)/_components/back-link";
import { GoogleSignIn } from "@/app/(auth)/_components/google-sign-in";
import { OTP_FOOTER, OtpStep } from "@/app/(auth)/_components/otp-step";
import { PasswordInput } from "@/app/(auth)/_components/password-input";
import { type FormState, signInAction } from "@/app/(auth)/actions";
import {
  AuthHeading,
  AuthPanel,
  AuthTag,
} from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";
import { LOCK_MINUTES, MAX_FAILED_LOGINS } from "@/lib/login-lock";

function SignInForm({
  googleEnabled,
  defaultEmail = "",
  statusAlert,
}: {
  googleEnabled: boolean;
  defaultEmail?: string;
  statusAlert?: React.ReactNode;
}) {
  const [values, setValues] = React.useState({
    email: defaultEmail,
    password: "",
    rememberMe: true,
  });
  const [state, setState] = React.useState<FormState>({});
  const [verifying, setVerifying] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};
  const wrongCredentials = state.code === "INVALID_CREDENTIALS";
  // Kode OTP sudah dikirim Better Auth saat masuk (sendOnSignIn).
  const unverifiedEmail =
    state.code === "EMAIL_NOT_VERIFIED" &&
    state.email === values.email.trim().toLowerCase()
      ? state.email
      : undefined;

  if (verifying && unverifiedEmail) {
    return (
      <AuthPanel
        topStart={
          <BackButton onClick={() => setVerifying(false)}>
            Kembali ke halaman masuk
          </BackButton>
        }
        footer={OTP_FOOTER}
      >
        <OtpStep email={unverifiedEmail} />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      topStart={<AuthTag>Masuk akun</AuthTag>}
      footer="Akses aman. Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi."
    >
      <AuthHeading
        title="Masuk ke akun Anda"
        description="Selamat datang kembali. Masuk dengan email atau Google — Anda langsung diarahkan ke ruang kerja sesuai peran akun."
      />
      {statusAlert}
      {wrongCredentials ? (
        <Alert tone="danger" title="Email atau kata sandi salah">
          Periksa kembali, atau gunakan Lupa kata sandi. Setelah{" "}
          {MAX_FAILED_LOGINS} kali gagal, akun dikunci sementara selama{" "}
          {LOCK_MINUTES} menit.
        </Alert>
      ) : (
        state.error && <Alert tone="danger">{state.error}</Alert>
      )}
      {unverifiedEmail && (
        <Alert tone="warning" title="Email belum diverifikasi">
          Kami sudah mengirim kode verifikasi baru ke {unverifiedEmail}.
          Verifikasi email terlebih dahulu untuk masuk.
        </Alert>
      )}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (unverifiedEmail) return setVerifying(true);
          startTransition(async () =>
            setState((await signInAction(values)) ?? {}),
          );
        }}
      >
        <FormField
          id="email"
          label="Alamat email"
          required
          error={errors.email}
        >
          <InputWithIcon
            id="email"
            type="email"
            icon={MailIcon}
            autoComplete="email"
            placeholder="nama@email.com"
            value={values.email}
            onChange={(event) =>
              setValues({ ...values, email: event.target.value })
            }
            aria-invalid={Boolean(errors.email)}
            aria-describedby={fieldDescribedBy("email", {
              error: errors.email,
            })}
          />
        </FormField>
        <FormField
          id="password"
          label="Kata sandi"
          required
          error={errors.password}
          action={<Link href="/lupa-password">Lupa kata sandi?</Link>}
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            value={values.password}
            onChange={(event) =>
              setValues({ ...values, password: event.target.value })
            }
            aria-invalid={Boolean(errors.password) || wrongCredentials}
            aria-describedby={fieldDescribedBy("password", {
              error: errors.password,
            })}
          />
        </FormField>
        <label className="flex items-center gap-2.5 text-small text-muted-foreground">
          <Checkbox
            checked={values.rememberMe}
            onCheckedChange={(value) =>
              setValues({ ...values, rememberMe: value === true })
            }
          />
          Ingat saya di perangkat ini
        </label>
        <Button type="submit" size="lg" disabled={pending}>
          {unverifiedEmail ? "Verifikasi email sekarang" : "Masuk ke beranda"}
        </Button>
        {googleEnabled && <GoogleSignIn label="Masuk dengan Google" />}
      </form>
      <p className="text-center text-small text-muted-foreground">
        Belum memiliki akun?{" "}
        <Link href="/daftar" className="text-small-strong text-primary-500">
          Daftar sekarang
        </Link>
      </p>
    </AuthPanel>
  );
}

export { SignInForm };
