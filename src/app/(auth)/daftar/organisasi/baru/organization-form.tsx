"use client";

import {
  ArrowRightIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  ClockIcon,
  HourglassIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { BackButton, BackLink } from "@/app/(auth)/_components/back-link";
import { uploadOrganizationLogo } from "@/app/(auth)/_components/logo-picker";
import {
  OrganizationFields,
  type OrganizationValues,
  SectionLabel,
} from "@/app/(auth)/_components/organization-fields";
import {
  OTP_ORGANIZATION_FOOTER,
  OtpStep,
  REGISTERED_NOTICE,
} from "@/app/(auth)/_components/otp-step";
import { PersonalFields } from "@/app/(auth)/_components/personal-fields";
import { StepBadge } from "@/app/(auth)/_components/step-badge";
import { TermsField } from "@/app/(auth)/_components/terms-field";
import {
  type FormState,
  registerOrganizationAction,
  setOrganizationLogoAction,
  signOutAction,
} from "@/app/(auth)/actions";
import {
  AuthHeading,
  AuthPanel,
  AuthTag,
} from "@/components/layout/auth-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { ORG_TYPES } from "@/components/ui/org-type-selected";
import type { OrganizationType } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/format";

/** Layar setelah pengajuan organisasi baru atau ajukan ulang terkirim. */
function SubmittedScreen({
  organizationName,
  organizationType,
  applicantName,
  email,
  submittedAt,
}: {
  organizationName: string;
  organizationType?: OrganizationType;
  applicantName?: string;
  email?: string;
  submittedAt?: Date;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Organisasi", value: organizationName },
    ...(organizationType
      ? [{ label: "Jenis", value: ORG_TYPES[organizationType].label }]
      : []),
    ...(applicantName ? [{ label: "Pemohon", value: applicantName }] : []),
    ...(submittedAt
      ? [{ label: "Diajukan", value: `${formatDateTime(submittedAt)} WIB` }]
      : []),
  ];

  return (
    <AuthPanel topStart={<AuthTag>Pengajuan organisasi</AuthTag>}>
      <AuthHeading
        icon={<IconBox icon={HourglassIcon} tone="warning" size="xl" />}
        title="Pengajuan terkirim"
        description={
          email ? (
            <>
              Email Anda sudah terverifikasi. Administrator akan meninjau
              pengajuan dalam 1–2 hari kerja, lalu mengirim hasilnya ke{" "}
              <span className="text-body-strong text-foreground">{email}</span>.
            </>
          ) : (
            "Email Anda sudah terverifikasi. Administrator akan meninjau pengajuan dalam 1–2 hari kerja, lalu mengirim hasilnya ke email Anda."
          )
        }
      />
      <dl className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <dt className="text-small text-muted-foreground">{label}</dt>
            <dd className="text-right text-body-strong text-foreground">
              {value}
            </dd>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-small text-muted-foreground">Status</dt>
          <dd>
            <Badge tone="neutral">
              <ClockIcon aria-hidden="true" />
              Menunggu persetujuan
            </Badge>
          </dd>
        </div>
      </dl>
      <ul className="flex flex-col gap-2.5 text-body">
        <li className="flex items-center gap-2.5 text-foreground">
          <CircleCheckIcon
            aria-hidden="true"
            className="size-4.5 shrink-0 text-success-600"
          />
          Data organisasi dikirim
        </li>
        <li className="flex items-center gap-2.5 text-foreground">
          <CircleCheckIcon
            aria-hidden="true"
            className="size-4.5 shrink-0 text-success-600"
          />
          Email terverifikasi
        </li>
        <li className="flex items-center gap-2.5 text-foreground">
          <CircleDotIcon
            aria-hidden="true"
            className="size-4.5 shrink-0 text-warning-500"
          />
          Ditinjau Administrator — sedang berlangsung
        </li>
        <li className="flex items-center gap-2.5 text-muted-foreground">
          <CircleIcon
            aria-hidden="true"
            className="size-4.5 shrink-0 text-subtle"
          />
          Akun Admin Organisasi aktif setelah disetujui
        </li>
      </ul>
      <form action={signOutAction}>
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          Kembali ke halaman masuk
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        Ada data yang salah?{" "}
        <a
          href="mailto:dukungan@becraft.id"
          className="text-body-strong text-primary-500 hover:underline"
        >
          Hubungi dukungan@becraft.id
        </a>
      </p>
    </AuthPanel>
  );
}

function OrganizationForm() {
  const [personal, setPersonal] = React.useState({
    name: "",
    email: "",
    password: "",
  });
  const [organization, setOrganization] = React.useState<OrganizationValues>({
    organizationName: "",
  });
  const [terms, setTerms] = React.useState(false);
  const [logo, setLogo] = React.useState<File | null>(null);
  const [state, setState] = React.useState<FormState>({});
  const [step, setStep] = React.useState<"form" | "otp" | "done">("form");
  const [submittedAt, setSubmittedAt] = React.useState<Date>();
  const [registered, setRegistered] = React.useState<{
    personal: typeof personal;
    organization: OrganizationValues;
    terms: boolean;
  }>();
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};

  if (step === "done")
    return (
      <SubmittedScreen
        organizationName={organization.organizationName}
        organizationType={organization.organizationType}
        applicantName={personal.name}
        email={state.email ?? personal.email}
        submittedAt={submittedAt}
      />
    );

  if (step === "otp" && state.email) {
    return (
      <AuthPanel
        topStart={
          <BackButton onClick={() => setStep("form")}>
            Kembali ke pendaftaran
          </BackButton>
        }
        footer={OTP_ORGANIZATION_FOOTER}
        topEnd={<StepBadge label="Organisasi baru" step={2} total={2} />}
      >
        <OtpStep
          organization="baru"
          email={state.email}
          onChangeEmail={() => setStep("form")}
          onVerified={async () => {
            if (logo) {
              const uploaded = await uploadOrganizationLogo(
                logo,
                setOrganizationLogoAction,
              ).catch(() => false);
              if (!uploaded)
                toast.error(
                  "Logo gagal diunggah. Anda bisa mengunggahnya nanti di Profil organisasi.",
                );
            }
            setSubmittedAt(new Date());
            setStep("done");
          }}
        />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      topStart={
        <BackLink href="/daftar/organisasi">Kembali ke pilihan jalur</BackLink>
      }
      topEnd={<StepBadge label="Organisasi baru" step={1} total={2} />}
    >
      <AuthHeading
        title="Daftarkan organisasi baru"
        description="Isi data diri dan data organisasi. Pengajuan ditinjau Administrator sebelum akun Admin Organisasi aktif."
      />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          // Akun untuk email ini sudah dibuat sebelum kembali dari OTP: lanjutkan verifikasinya.
          if (
            registered &&
            personal.email.trim().toLowerCase() === state.email
          ) {
            const current = { personal, organization, terms };
            if (JSON.stringify(current) !== JSON.stringify(registered)) {
              setPersonal(registered.personal);
              setOrganization(registered.organization);
              setTerms(registered.terms);
              toast.info(REGISTERED_NOTICE);
            }
            return setStep("otp");
          }
          startTransition(async () => {
            const result = await registerOrganizationAction({
              ...personal,
              ...organization,
              terms,
            });
            setState(result);
            if (result.ok) {
              setRegistered({ personal, organization, terms });
              setStep("otp");
            }
          });
        }}
      >
        <SectionLabel>Data diri</SectionLabel>
        <PersonalFields
          values={personal}
          onChange={setPersonal}
          errors={errors}
          emailTaken={state.code === "EMAIL_TAKEN"}
        />
        <SectionLabel>Data organisasi</SectionLabel>
        <OrganizationFields
          values={organization}
          onChange={setOrganization}
          errors={errors}
          logo={logo}
          onLogoChange={setLogo}
        />
        <TermsField
          checked={terms}
          onCheckedChange={setTerms}
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
        Sudah punya kode organisasi?{" "}
        <Link
          href="/daftar/organisasi/gabung"
          className="text-small-strong text-primary-500"
        >
          Gabung ke organisasi
        </Link>
      </p>
    </AuthPanel>
  );
}

export { OrganizationForm, SubmittedScreen };
