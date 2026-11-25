"use client";

import { MailCheckIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { type FormState, forgotPasswordAction } from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Button } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";
import { InputWithIcon } from "@/components/ui/input";

function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<FormState>({});
  const [pending, startTransition] = React.useTransition();
  const error = state.fieldErrors?.email ?? state.error;

  function submit() {
    startTransition(async () => {
      const result = await forgotPasswordAction({ email });
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
      <AuthPanel topStart={<BackLink href="/masuk">Kembali ke Masuk</BackLink>}>
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
              baru. Tautan berlaku 1 jam.
            </>
          }
        />
        {state.error && (
          <p role="alert" className="text-small text-danger-500">
            {state.error}
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={submit}
          disabled={pending}
        >
          Kirim ulang tautan
        </Button>
        <Link
          href="/masuk"
          className="text-center text-small-strong text-primary-500"
        >
          Kembali ke Masuk
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel topStart={<BackLink href="/masuk">Kembali ke Masuk</BackLink>}>
      <AuthHeading
        title="Lupa kata sandi?"
        description="Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru."
      />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <FormField id="email" label="Email" error={error}>
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
          Kirim tautan
        </Button>
      </form>
    </AuthPanel>
  );
}

export { ForgotPasswordForm };
