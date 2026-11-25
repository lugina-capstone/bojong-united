"use client";

import {
  Building2Icon,
  ChevronRightIcon,
  MailIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackButton } from "@/app/(auth)/_components/back-link";
import { GoogleSignIn } from "@/app/(auth)/_components/google-sign-in";
import { OTP_FOOTER, OtpStep } from "@/app/(auth)/_components/otp-step";
import { PasswordInput } from "@/app/(auth)/_components/password-input";
import { TermsField } from "@/app/(auth)/_components/terms-field";
import { type FormState, signUpAction } from "@/app/(auth)/actions";
import {
  AuthHeading,
  AuthPanel,
  AuthTag,
} from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";

function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    password: "",
    terms: false,
  });
  const [state, setState] = React.useState<FormState>({});
  const [verifyEmail, setVerifyEmail] = React.useState<string>();
  const [registered, setRegistered] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};
  const emailTaken =
    state.code === "EMAIL_TAKEN" && state.email === values.email;

  if (verifyEmail) {
    return (
      <AuthPanel
        topStart={
          <BackButton onClick={() => setVerifyEmail(undefined)}>
            Kembali ke pendaftaran
          </BackButton>
        }
        footer={OTP_FOOTER}
      >
        <OtpStep
          email={verifyEmail}
          onChangeEmail={() => setVerifyEmail(undefined)}
        />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel topStart={<AuthTag>Pendaftaran akun</AuthTag>}>
      <AuthHeading
        title="Buat akun baru"
        description="Daftar sebagai peserta untuk mengikuti acara dari organisasi mana pun. Isi formulir di bawah atau gunakan Google."
      />
      {emailTaken && (
        <Alert tone="danger" title="Email sudah terdaftar">
          <p>
            {state.email} sudah memiliki akun Becraft. Satu email hanya bisa
            dipakai untuk satu akun — silakan masuk, atau gunakan email lain.
          </p>
          <Link
            href={`/masuk?email=${encodeURIComponent(state.email ?? "")}`}
            className="mt-1 inline-block text-small-strong underline"
          >
            Masuk dengan email ini →
          </Link>
        </Alert>
      )}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          // Akun untuk email ini sudah dibuat sebelum kembali dari OTP: lanjutkan verifikasinya.
          if (values.email.trim().toLowerCase() === registered)
            return setVerifyEmail(registered);
          startTransition(async () => {
            const result = await signUpAction(values);
            setState({ ...result, email: result.email ?? values.email });
            if (result.ok && result.email) {
              setRegistered(result.email);
              setVerifyEmail(result.email);
            }
          });
        }}
      >
        <FormField id="name" label="Nama lengkap" required error={errors.name}>
          <InputWithIcon
            id="name"
            icon={UserRoundIcon}
            autoComplete="name"
            placeholder="Nama sesuai identitas"
            value={values.name}
            onChange={(event) =>
              setValues({ ...values, name: event.target.value })
            }
            aria-invalid={Boolean(errors.name)}
            aria-describedby={fieldDescribedBy("name", { error: errors.name })}
          />
        </FormField>
        <FormField
          id="email"
          label="Alamat email"
          required
          error={
            emailTaken
              ? "Email ini sudah terdaftar. Gunakan email lain atau masuk ke akun Anda."
              : errors.email
          }
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
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
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
        <TermsField
          checked={values.terms}
          onCheckedChange={(terms) => setValues({ ...values, terms })}
          error={errors.terms}
        />
        {state.error && (
          <p role="alert" className="text-small text-danger-500">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          Daftar sekarang
        </Button>
        {googleEnabled && <GoogleSignIn label="Daftar dengan Google" />}
      </form>
      <p className="text-center text-small text-muted-foreground">
        Sudah memiliki akun?{" "}
        <Link href="/masuk" className="text-small-strong text-primary-500">
          Masuk
        </Link>
      </p>
      <Link
        href="/daftar/organisasi"
        className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3.5 hover:border-primary-200 hover:bg-primary-50"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-500">
          <Building2Icon aria-hidden="true" className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-small-strong text-primary-500">
            Daftar sebagai organisasi
          </span>
          <span className="block text-caption text-muted-foreground">
            Untuk guru, asesor, atau trainer dari sekolah, lembaga, dan
            perusahaan.
          </span>
        </span>
        <ChevronRightIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-primary-500"
        />
      </Link>
    </AuthPanel>
  );
}

export { SignUpForm };
