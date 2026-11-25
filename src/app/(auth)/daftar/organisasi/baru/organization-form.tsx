"use client";

import { ArrowRightIcon, SendIcon } from "lucide-react";
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
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";

/** Layar setelah pengajuan organisasi baru atau ajukan ulang terkirim. */
function SubmittedScreen({ organizationName }: { organizationName: string }) {
  return (
    <AuthPanel>
      <AuthHeading
        icon={<IconBox icon={SendIcon} tone="success" size="lg" />}
        title="Pengajuan terkirim"
        description={
          <>
            Pengajuan{" "}
            <span className="text-body-strong text-foreground">
              {organizationName}
            </span>{" "}
            sedang ditinjau Administrator Becraft. Kami kirim email setelah
            pengajuan disetujui atau ditolak.
          </>
        }
      />
      <form action={signOutAction}>
        <Button type="submit" size="lg" className="w-full">
          Kembali ke Masuk
        </Button>
      </form>
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
  const [registered, setRegistered] = React.useState<{
    personal: typeof personal;
    organization: OrganizationValues;
    terms: boolean;
  }>();
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};

  if (step === "done")
    return <SubmittedScreen organizationName={organization.organizationName} />;

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
