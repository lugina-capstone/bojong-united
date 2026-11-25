"use client";

import { CircleCheckIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { PasswordInput } from "@/app/(auth)/_components/password-input";
import { type FormState, resetPasswordAction } from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";

function ExpiredLink() {
  return (
    <AuthPanel topStart={<BackLink href="/masuk">Kembali ke Masuk</BackLink>}>
      <AuthHeading
        icon={<IconBox icon={LinkIcon} tone="danger" size="lg" />}
        title="Tautan sudah kedaluwarsa"
        description="Tautan atur ulang kata sandi hanya berlaku 1 jam dan sekali pakai. Minta tautan baru untuk melanjutkan."
      />
      <Link href="/lupa-password" className={buttonVariants({ size: "lg" })}>
        Minta tautan baru
      </Link>
    </AuthPanel>
  );
}

function ResetPasswordForm({ token }: { token?: string }) {
  const [values, setValues] = React.useState({
    password: "",
    confirmPassword: "",
  });
  const [state, setState] = React.useState<FormState>({});
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};

  if (!token || state.code === "INVALID_TOKEN") return <ExpiredLink />;

  if (state.ok) {
    return (
      <AuthPanel>
        <AuthHeading
          icon={<IconBox icon={CircleCheckIcon} tone="success" size="lg" />}
          title="Kata sandi berhasil diubah"
          description="Silakan masuk dengan kata sandi baru. Sesi di perangkat lain sudah dikeluarkan."
        />
        <Link href="/masuk" className={buttonVariants({ size: "lg" })}>
          Masuk
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel topStart={<BackLink href="/masuk">Kembali ke Masuk</BackLink>}>
      <AuthHeading
        title="Buat kata sandi baru"
        description="Gunakan minimal 8 karakter yang belum pernah Anda pakai."
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
          description="Minimal 8 karakter."
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
            aria-describedby={fieldDescribedBy("password", {
              error: errors.password,
              description: true,
            })}
          />
        </FormField>
        <FormField
          id="confirmPassword"
          label="Ulangi kata sandi baru"
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
          Simpan kata sandi
        </Button>
      </form>
    </AuthPanel>
  );
}

export { ResetPasswordForm };
