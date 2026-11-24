"use client";

import { MailIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

import { PasswordInput } from "@/app/(auth)/_components/password-input";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";

export type PersonalValues = { name: string; email: string; password: string };

/** Nama, email, dan kata sandi untuk form daftar organisasi dan gabung. */
function PersonalFields({
  values,
  onChange,
  errors,
  emailTaken,
}: {
  values: PersonalValues;
  onChange: (values: PersonalValues) => void;
  errors: Record<string, string>;
  emailTaken?: boolean;
}) {
  return (
    <>
      <FormField id="name" label="Nama lengkap" required error={errors.name}>
        <InputWithIcon
          id="name"
          icon={UserRoundIcon}
          autoComplete="name"
          placeholder="Nama sesuai identitas"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
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
          errors.email && (
            <>
              {errors.email}{" "}
              {emailTaken && (
                <Link href="/masuk" className="text-caption-strong underline">
                  Masuk
                </Link>
              )}
            </>
          )
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
            onChange({ ...values, email: event.target.value })
          }
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescribedBy("email", { error: errors.email })}
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
            onChange({ ...values, password: event.target.value })
          }
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescribedBy("password", {
            error: errors.password,
          })}
        />
      </FormField>
    </>
  );
}

export { PersonalFields };
