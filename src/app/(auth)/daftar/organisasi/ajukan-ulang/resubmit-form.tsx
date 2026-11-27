"use client";

import { ArrowRightIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { BackLink } from "@/app/(auth)/_components/back-link";
import { uploadOrganizationLogo } from "@/app/(auth)/_components/logo-picker";
import {
  OrganizationFields,
  type OrganizationValues,
  SectionLabel,
} from "@/app/(auth)/_components/organization-fields";
import { SubmittedScreen } from "@/app/(auth)/daftar/organisasi/baru/organization-form";
import {
  type FormState,
  resubmitOrganizationAction,
  setOrganizationLogoAction,
} from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function ResubmitForm({
  initial,
  applicantName,
  applicantEmail,
  rejectionReason,
}: {
  initial: Required<OrganizationValues>;
  applicantName: string;
  applicantEmail: string;
  rejectionReason: string | null;
}) {
  const [values, setValues] = React.useState<OrganizationValues>(initial);
  const [logo, setLogo] = React.useState<File | null>(null);
  const [submittedAt, setSubmittedAt] = React.useState<Date>();
  const [state, setState] = React.useState<FormState>({});
  const [pending, startTransition] = React.useTransition();

  if (state.ok)
    return (
      <SubmittedScreen
        organizationName={values.organizationName}
        organizationType={values.organizationType}
        applicantName={applicantName}
        email={applicantEmail}
        submittedAt={submittedAt}
      />
    );

  return (
    <AuthPanel
      topStart={
        <BackLink href="/masuk?status=ditolak">
          Kembali ke halaman masuk
        </BackLink>
      }
      topEnd={<Badge tone="primary">Ajukan ulang organisasi</Badge>}
    >
      <AuthHeading
        title="Ajukan ulang organisasi"
        description="Perbaiki data organisasi sesuai alasan penolakan. Pengajuan ditinjau Administrator sebelum akun Admin Organisasi aktif."
      />
      <Alert tone="danger" title="Alasan penolakan sebelumnya">
        {rejectionReason ?? "Administrator belum menuliskan alasan penolakan."}{" "}
        Perbaiki data di bawah, lalu kirim ulang pengajuan.
      </Alert>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await resubmitOrganizationAction(values);
            if (result.ok) {
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
            }
            setState(result);
          });
        }}
      >
        <SectionLabel>Data organisasi</SectionLabel>
        <OrganizationFields
          values={values}
          onChange={setValues}
          errors={state.fieldErrors ?? {}}
          logo={logo}
          onLogoChange={setLogo}
        />
        {state.error && (
          <p role="alert" className="text-small text-danger-500">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          Kirim pengajuan ulang
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </form>
    </AuthPanel>
  );
}

export { ResubmitForm };
