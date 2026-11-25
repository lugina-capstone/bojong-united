"use client";

import {
  ArrowLeftIcon,
  CheckIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";
import {
  formatPhone,
  normalizePhone,
  profileSchema,
} from "@/lib/validations/profile";

import { type ProfileFormState, updateProfileAction } from "../actions";
import { CertificatePreview } from "./certificate-preview";

const FORM_ID = "form-edit-profil";

/** Form "Edit informasi profil": nama lengkap dan nomor HP, dengan pratinjau e-sertifikat. */
export function ProfileForm({
  initial,
  email,
  emailNote,
}: {
  initial: { name: string; phone: string | null };
  email: string;
  emailNote: string;
}) {
  const [values, setValues] = React.useState({
    name: initial.name,
    phone: initial.phone ? formatPhone(initial.phone) : "",
  });
  const [state, setState] = React.useState<ProfileFormState>({});
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};

  const name = values.name.trim();
  const phone = normalizePhone(values.phone);
  const nameChanged = name !== initial.name;
  const phoneChanged = phone !== (initial.phone ?? "");
  const changes = [
    ...(nameChanged
      ? [{ label: "Nama lengkap", from: initial.name, to: name || "(kosong)" }]
      : []),
    ...(phoneChanged
      ? [
          {
            label: "Nomor HP",
            from: initial.phone ? formatPhone(initial.phone) : "Belum diisi",
            to: phone ? formatPhone(phone) : "Dikosongkan",
          },
        ]
      : []),
  ];
  const changed = changes.length > 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        fieldErrors[String(issue.path[0])] ??= issue.message;
      setState({ fieldErrors });
      return;
    }
    startTransition(async () => setState(await updateProfileAction(values)));
  }

  const actions = (
    <>
      <Link href="/profil" className={buttonVariants({ variant: "secondary" })}>
        Batal
      </Link>
      <Button
        type="submit"
        form={FORM_ID}
        disabled={!changed}
        loading={pending}
      >
        <CheckIcon aria-hidden="true" />
        Simpan perubahan
      </Button>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display text-foreground">
              Edit informasi profil
            </h1>
            {changed && (
              <Badge tone="warning">
                <PencilIcon aria-hidden="true" />
                {changes.length} perubahan belum disimpan
              </Badge>
            )}
          </div>
          <p className="text-body text-muted-foreground">
            Perbarui nama lengkap atau nomor HP Anda. Pratinjau e-sertifikat
            diperbarui langsung.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <form
            id={FORM_ID}
            noValidate
            onSubmit={submit}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            {state.error && <Alert tone="danger" title={state.error} />}
            <FormField
              id="name"
              label="Nama lengkap"
              required
              action={
                nameChanged && (
                  <Badge tone="success" size="sm">
                    Diubah
                  </Badge>
                )
              }
              description="Pastikan penulisan nama sesuai dokumen resmi untuk e-sertifikat acara."
              error={errors.name}
            >
              <InputWithIcon
                id="name"
                icon={UserRoundIcon}
                autoComplete="name"
                maxLength={100}
                value={values.name}
                onChange={(event) =>
                  setValues({ ...values, name: event.target.value })
                }
                aria-invalid={Boolean(errors.name)}
                aria-describedby={fieldDescribedBy("name", {
                  error: errors.name,
                  description: true,
                })}
              />
            </FormField>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                id="email"
                label="Alamat email"
                description={emailNote}
              >
                <InputWithIcon
                  id="email"
                  icon={MailIcon}
                  value={email}
                  readOnly
                  disabled
                  aria-describedby="email-description"
                />
              </FormField>
              <FormField
                id="phone"
                label="Nomor HP"
                action={
                  phoneChanged && (
                    <Badge tone="success" size="sm">
                      Diubah
                    </Badge>
                  )
                }
                description="Digunakan untuk koordinasi dan notifikasi kegiatan."
                error={errors.phone}
              >
                <InputWithIcon
                  id="phone"
                  icon={PhoneIcon}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0857-1122-0074"
                  maxLength={20}
                  value={values.phone}
                  onChange={(event) =>
                    setValues({ ...values, phone: event.target.value })
                  }
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={fieldDescribedBy("phone", {
                    error: errors.phone,
                    description: true,
                  })}
                />
              </FormField>
            </div>
            <FormField
              id="role"
              label="Peran"
              description="Akun Anda terdaftar sebagai Peserta."
            >
              <InputWithIcon
                id="role"
                icon={ShieldIcon}
                value="Peserta"
                readOnly
                disabled
                aria-describedby="role-description"
              />
            </FormField>
            <Alert title="Informasi E-Sertifikat & Data Peserta">
              Nama profil ini otomatis dicantumkan pada e-sertifikat kelulusan
              acara mendatang dan tidak memperbarui sertifikat yang sudah
              diterbitkan.
            </Alert>
          </form>
          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
            <Link
              href="/profil"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <ArrowLeftIcon aria-hidden="true" />
              Batal
            </Link>
            <p className="flex-1 text-small text-muted-foreground">
              {changed
                ? `${changes.length} kolom diubah · ${changes.map((c) => c.label).join(" dan ")}`
                : "Belum ada perubahan"}
            </p>
            <Button
              type="submit"
              form={FORM_ID}
              size="lg"
              disabled={!changed}
              loading={pending}
            >
              <CheckIcon aria-hidden="true" />
              Simpan perubahan
            </Button>
          </div>
        </div>
        <aside className="flex flex-col gap-6">
          <CertificatePreview title="Pratinjau nama terbaru" name={name} />
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-h3 text-foreground">
              Perubahan yang akan disimpan
            </h2>
            {changed ? (
              <dl className="flex flex-col gap-2">
                {changes.map((change) => (
                  <div
                    key={change.label}
                    className="flex flex-col gap-0.5 rounded-lg bg-muted p-3"
                  >
                    <dt className="text-caption text-muted-foreground">
                      {change.label}
                    </dt>
                    <dd className="text-small-strong break-words text-foreground">
                      {change.from} → {change.to}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-small text-muted-foreground">
                Belum ada perubahan.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
