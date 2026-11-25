"use client";

import { ArrowRightIcon, CircleCheckIcon, KeyRoundIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { BackButton, BackLink } from "@/app/(auth)/_components/back-link";
import {
  OTP_ORGANIZATION_FOOTER,
  OtpStep,
  REGISTERED_NOTICE,
} from "@/app/(auth)/_components/otp-step";
import { PersonalFields } from "@/app/(auth)/_components/personal-fields";
import { StepBadge } from "@/app/(auth)/_components/step-badge";
import { TermsField } from "@/app/(auth)/_components/terms-field";
import {
  checkOrganizationCodeAction,
  type FormState,
  registerMemberAction,
} from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Button } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";
import { ORG_TYPES } from "@/components/ui/org-type-selected";
import type { OrganizationType } from "@/generated/prisma/enums";

type CodeCheck =
  { valid: true; name: string; type: OrganizationType } | { valid: false };

const INVALID_CODE = "Kode tidak valid atau organisasi tidak aktif.";

function OrganizationPreview({
  name,
  type,
}: {
  name: string;
  type: OrganizationType;
}) {
  const { label, icon: Icon } = ORG_TYPES[type];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-card text-success-600">
        <Icon aria-hidden="true" className="size-4.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-strong text-foreground">{name}</p>
        <p className="text-caption text-muted-foreground">{label}</p>
        <p className="text-small text-label">
          Anda akan bergabung sebagai anggota organisasi ini.
        </p>
      </div>
      <span className="flex items-center gap-1 text-caption-strong text-success-700">
        <CircleCheckIcon aria-hidden="true" className="size-3.5" />
        Kode valid
      </span>
    </div>
  );
}

function JoinForm() {
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    password: "",
    code: "",
    terms: false,
  });
  const [check, setCheck] = React.useState<CodeCheck>();
  const [state, setState] = React.useState<FormState>({});
  const [verifyEmail, setVerifyEmail] = React.useState<string>();
  const [registered, setRegistered] = React.useState<{
    email: string;
    values: typeof values;
  }>();
  const [pending, startTransition] = React.useTransition();
  // Transisi terpisah agar pengecekan kode tidak menonaktifkan tombol kirim di tengah klik.
  const [, startCodeCheck] = React.useTransition();
  const errors: Record<string, string> = {
    ...state.fieldErrors,
    ...(check?.valid === false && { code: INVALID_CODE }),
  };

  const checkTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(checkTimer.current), []);

  function checkCode(code: string) {
    clearTimeout(checkTimer.current);
    if (code.trim().length < 4) return setCheck(undefined);
    startCodeCheck(async () =>
      setCheck(await checkOrganizationCodeAction(code)),
    );
  }

  if (verifyEmail) {
    return (
      <AuthPanel
        topStart={
          <BackButton onClick={() => setVerifyEmail(undefined)}>
            Kembali ke pendaftaran
          </BackButton>
        }
        footer={OTP_ORGANIZATION_FOOTER}
        topEnd={<StepBadge label="Gabung organisasi" step={2} total={2} />}
      >
        <OtpStep
          organization="gabung"
          email={verifyEmail}
          onChangeEmail={() => setVerifyEmail(undefined)}
        />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      topStart={
        <BackLink href="/daftar/organisasi">Kembali ke pilihan jalur</BackLink>
      }
      topEnd={<StepBadge label="Gabung organisasi" step={1} total={2} />}
    >
      <AuthHeading
        title="Gabung ke organisasi"
        description="Masukkan data diri dan kode organisasi dari admin. Akun langsung aktif sebagai anggota setelah email terverifikasi."
      />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          // Akun untuk email ini sudah dibuat sebelum kembali dari OTP: lanjutkan verifikasinya.
          if (
            registered &&
            values.email.trim().toLowerCase() === registered.email
          ) {
            if (JSON.stringify(values) !== JSON.stringify(registered.values)) {
              setValues(registered.values);
              toast.info(REGISTERED_NOTICE);
            }
            return setVerifyEmail(registered.email);
          }
          startTransition(async () => {
            const result = await registerMemberAction(values);
            setState(result);
            if (result.ok && result.email) {
              setRegistered({ email: result.email, values });
              setVerifyEmail(result.email);
            }
          });
        }}
      >
        <PersonalFields
          values={values}
          onChange={(personal) => setValues({ ...values, ...personal })}
          errors={errors}
          emailTaken={state.code === "EMAIL_TAKEN"}
        />
        <FormField
          id="code"
          label="Kode organisasi"
          required
          error={errors.code}
        >
          <InputWithIcon
            id="code"
            icon={KeyRoundIcon}
            autoComplete="off"
            placeholder="Contoh: SMKN4BDG"
            value={values.code}
            onChange={(event) => {
              const code = event.target.value.toUpperCase();
              setValues({ ...values, code });
              setCheck(undefined);
              // Dicek saat mengetik agar pratinjau sudah tampil sebelum tombol kirim diklik.
              clearTimeout(checkTimer.current);
              checkTimer.current = setTimeout(() => checkCode(code), 500);
            }}
            onBlur={(event) => {
              if (!check) checkCode(event.target.value);
            }}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={fieldDescribedBy("code", { error: errors.code })}
          />
        </FormField>
        {check?.valid && (
          <OrganizationPreview name={check.name} type={check.type} />
        )}
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
          Lanjut verifikasi email
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </form>
      <p className="text-center text-small text-muted-foreground">
        Belum punya organisasi?{" "}
        <Link
          href="/daftar/organisasi/baru"
          className="text-small-strong text-primary-500"
        >
          Daftarkan organisasi baru
        </Link>
      </p>
    </AuthPanel>
  );
}

export { JoinForm };
