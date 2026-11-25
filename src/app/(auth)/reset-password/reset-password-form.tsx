"use client";

import { CircleCheckIcon, CircleIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { PasswordInput } from "@/app/(auth)/_components/password-input";
import { type FormState, resetPasswordAction } from "@/app/(auth)/actions";
import { ForgotPasswordForm } from "@/app/(auth)/lupa-password/forgot-password-form";
import {
  AuthHeading,
  AuthPanel,
  AuthTag,
} from "@/components/layout/auth-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";
import { passwordChecks, passwordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

const STRENGTH_LABEL = ["", "Lemah", "Cukup", "Baik", "Kuat"];

/** Indikator kekuatan: 4 batang dan 3 kriteria. Hanya panduan; syarat wajibnya minimal 8 karakter. */
function PasswordStrength({ password }: { password: string }) {
  const level = passwordStrength(password);
  const tone =
    level >= 3
      ? "bg-success-500"
      : level === 2
        ? "bg-warning-500"
        : "bg-danger-500";
  return (
    <div
      id="password-strength"
      className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-3"
    >
      <div className="flex items-center gap-2">
        <div aria-hidden="true" className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className={cn(
                "h-1 flex-1 rounded-full",
                bar <= level ? tone : "bg-border",
              )}
            />
          ))}
        </div>
        <span
          role="status"
          className="min-w-10 text-right text-caption-strong text-label"
        >
          {STRENGTH_LABEL[level]}
        </span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
        {passwordChecks(password).map(({ label, met }) => {
          const Icon = met ? CircleCheckIcon : CircleIcon;
          return (
            <li key={label} className="flex items-center gap-1">
              <Icon
                aria-hidden="true"
                className={cn(
                  "size-3.5",
                  met ? "text-success-700" : "text-subtle",
                )}
              />
              {label}
              <span className="sr-only">
                {met ? " (terpenuhi)" : " (belum terpenuhi)"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [values, setValues] = React.useState({
    password: "",
    confirmPassword: "",
  });
  const [state, setState] = React.useState<FormState>({});
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};

  if (state.code === "INVALID_TOKEN") return <ForgotPasswordForm expired />;

  if (state.ok) {
    return (
      <AuthPanel
        topStart={<BackLink href="/masuk">Kembali ke halaman masuk</BackLink>}
        footer="Tautan atur ulang hanya dapat digunakan satu kali demi keamanan akun Anda."
      >
        <AuthHeading
          icon={<IconBox icon={CircleCheckIcon} tone="success" size="lg" />}
          title="Kata sandi berhasil diubah"
          description="Silakan masuk dengan kata sandi baru. Demi keamanan, semua sesi di perangkat lain sudah dikeluarkan."
        />
        <Link href="/masuk" className={buttonVariants({ size: "lg" })}>
          Masuk sekarang
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      topStart={<AuthTag>Atur ulang kata sandi</AuthTag>}
      footer="Kata sandi Anda dienkripsi dan tidak pernah dibagikan kepada pihak lain."
    >
      <AuthHeading
        title="Buat kata sandi baru"
        description={
          <>
            Atur kata sandi baru untuk akun{" "}
            <span className="text-body-strong text-foreground">{email}</span>.
            Pastikan berbeda dari kata sandi sebelumnya.
          </>
        }
      />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () =>
            setState(await resetPasswordAction(token, values)),
          );
        }}
      >
        <FormField
          id="password"
          label="Kata sandi baru"
          required
          error={errors.password}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) =>
              setValues({ ...values, password: event.target.value })
            }
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              fieldDescribedBy("password", { error: errors.password }) ??
              "password-strength"
            }
          />
        </FormField>
        <PasswordStrength password={values.password} />
        <FormField
          id="confirmPassword"
          label="Konfirmasi kata sandi baru"
          required
          error={errors.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) =>
              setValues({ ...values, confirmPassword: event.target.value })
            }
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={fieldDescribedBy("confirmPassword", {
              error: errors.confirmPassword,
            })}
          />
        </FormField>
        {state.error && (
          <p role="alert" className="text-small text-danger-500">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          Simpan kata sandi baru
        </Button>
      </form>
      <Link
        href="/masuk"
        className="text-center text-small-strong text-foreground hover:underline"
      >
        Kembali ke Halaman Masuk
      </Link>
    </AuthPanel>
  );
}

export { ResetPasswordForm };
