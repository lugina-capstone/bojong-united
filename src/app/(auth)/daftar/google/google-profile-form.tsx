"use client";

import { CircleCheckIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import {
  completeGoogleProfileAction,
  type FormState,
  signOutAction,
} from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Button } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";
import { initialsOf } from "@/components/ui/org-logo";

function GoogleProfileForm({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const [name, setName] = React.useState(initialName);
  const [state, setState] = React.useState<FormState>({});
  const [pending, startTransition] = React.useTransition();
  const error = state.fieldErrors?.name;

  return (
    <AuthPanel
      topStart={<BackLink href="/daftar">Kembali ke pendaftaran</BackLink>}
      footer="Koneksi Google terenkripsi. Anda dapat mengubah data profil kapan saja."
    >
      <AuthHeading
        title="Lengkapi data akun Google"
        description={
          <>
            Akun Google berhasil terhubung. Lengkapi data untuk membuat akun
            Peserta. Mendaftar untuk organisasi? Gunakan{" "}
            <Link
              href="/daftar/organisasi"
              className="text-body-strong text-primary-500"
            >
              Daftar sebagai organisasi
            </Link>
            .
          </>
        }
      />
      <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-500 text-small-strong text-inverse">
          {initialsOf(name || initialName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-strong text-foreground">
            {name || initialName}
          </p>
          <p className="truncate text-caption text-muted-foreground">{email}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-caption-strong text-success-700">
          <CircleCheckIcon aria-hidden="true" className="size-3.5" />
          Terhubung
        </span>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () =>
            setState((await completeGoogleProfileAction({ name })) ?? {}),
          );
        }}
      >
        <FormField id="name" label="Nama lengkap" required error={error}>
          <InputWithIcon
            id="name"
            icon={UserRoundIcon}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={fieldDescribedBy("name", { error })}
          />
        </FormField>
        <p className="rounded-lg bg-muted p-3 text-caption text-muted-foreground">
          Becraft hanya menerima nama, email, dan foto profil Google Anda. Kata
          sandi Google tidak pernah dibagikan.
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          Selesaikan pendaftaran
        </Button>
      </form>
      <form action={signOutAction} className="text-center">
        <button
          type="submit"
          className="text-small-strong text-primary-500 hover:underline"
        >
          Gunakan akun Google lain
        </button>
      </form>
    </AuthPanel>
  );
}

export { GoogleProfileForm };
