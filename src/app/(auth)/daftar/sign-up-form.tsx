"use client";

import { MailIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { GoogleSignIn } from "@/app/(auth)/_components/google-sign-in";
import { OtpStep } from "@/app/(auth)/_components/otp-step";
import { PasswordInput } from "@/app/(auth)/_components/password-input";
import { StepBadge } from "@/app/(auth)/_components/step-badge";
import { TermsField } from "@/app/(auth)/_components/terms-field";
import { type FormState, signUpAction } from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
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
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};

  if (verifyEmail) {
    return (
      <AuthPanel
        topStart={<BackLink href="/daftar">Kembali</BackLink>}
        topEnd={<StepBadge step={2} total={2} />}
      >
        <OtpStep
          email={verifyEmail}
          onChangeEmail={() => setVerifyEmail(undefined)}
        />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      topStart={<BackLink href="/">Beranda</BackLink>}
      topEnd={<StepBadge step={1} total={2} />}
    >
      <AuthHeading
        title="Buat akun Becraft"
        description="Daftar sebagai Peserta untuk mengikuti acara dan materi."
      />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await signUpAction(values);
            setState(result);
            if (result.ok && result.email) setVerifyEmail(result.email);
          });
        }}
      >
        <FormField id="name" label="Nama lengkap" error={errors.name}>
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
          label="Email"
          error={
            errors.email &&
            (state.code === "EMAIL_TAKEN" ? (
              <>
                {errors.email}{" "}
                <Link href="/masuk" className="text-caption-strong underline">
                  Masuk
                </Link>
              </>
            ) : (
              errors.email
            ))
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
          description="Minimal 8 karakter."
          error={errors.password}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Buat kata sandi"
            value={values.password}
            onChange={(event) =>
              setValues({ ...values, password: event.target.value })
            }
            aria-invalid={Boolean(errors.password)}
            aria-describedby={fieldDescribedBy("password", {
              error: errors.password,
              description: true,
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
          Daftar
        </Button>
        {googleEnabled && <GoogleSignIn label="Daftar dengan Google" />}
      </form>
      <p className="text-center text-small text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="text-small-strong text-primary-500">
          Masuk
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

export { SignUpForm };
