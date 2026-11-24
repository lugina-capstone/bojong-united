"use client";

import { MailIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { GoogleSignIn } from "@/app/(auth)/_components/google-sign-in";
import { OtpStep } from "@/app/(auth)/_components/otp-step";
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
  const [verifyEmail, setVerifyEmail] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};

  if (verifyEmail) {
    return (
      <AuthPanel topStart={<BackLink href="/masuk">Kembali</BackLink>}>
        <OtpStep email={verifyEmail} />
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
      {state.error && (
        <Alert tone="danger" role="alert">
          {state.error}
        </Alert>
      )}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await signInAction(values);
            setState(result ?? {});
            // Kode OTP sudah dikirim Better Auth saat masuk (sendOnSignIn).
            if (result?.code === "EMAIL_NOT_VERIFIED" && result.email)
              setVerifyEmail(result.email);
          });
        }}
      >
        <FormField id="email" label="Email" error={errors.email}>
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
            aria-invalid={Boolean(errors.password)}
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
          Masuk ke beranda
        </Button>
        {googleEnabled && <GoogleSignIn label="Masuk dengan Google" />}
      </form>
      <p className="text-center text-small text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-small-strong text-primary-500">
          Daftar
        </Link>
        {" · "}
        <Link
          href="/daftar/organisasi"
          className="text-small-strong text-primary-500"
        >
          Daftar sebagai organisasi
        </Link>
      </p>
    </AuthPanel>
  );
}

export { SignInForm };
