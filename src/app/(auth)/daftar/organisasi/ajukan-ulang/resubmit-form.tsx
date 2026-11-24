"use client";

import { SendIcon } from "lucide-react";
import * as React from "react";

import { BackLink } from "@/app/(auth)/_components/back-link";
import {
  OrganizationFields,
  type OrganizationValues,
} from "@/app/(auth)/_components/organization-fields";
import { SubmittedScreen } from "@/app/(auth)/daftar/organisasi/baru/organization-form";
import {
  type FormState,
  resubmitOrganizationAction,
} from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function ResubmitForm({
  initial,
  rejectionReason,
}: {
  initial: Required<OrganizationValues>;
  rejectionReason: string | null;
}) {
  const [values, setValues] = React.useState<OrganizationValues>(initial);
  const [state, setState] = React.useState<FormState>({});
  const [pending, startTransition] = React.useTransition();

  if (state.ok)
    return <SubmittedScreen organizationName={values.organizationName} />;

  return (
    <AuthPanel
      topStart={<BackLink href="/masuk?status=ditolak">Kembali</BackLink>}
    >
      <AuthHeading
        title="Ajukan ulang organisasi"
        description="Perbaiki data sesuai alasan penolakan, lalu kirim lagi untuk ditinjau Administrator."
      />
      <Alert tone="danger" title="Alasan penolakan">
        {rejectionReason ?? "Administrator belum menuliskan alasan penolakan."}
      </Alert>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () =>
            setState(await resubmitOrganizationAction(values)),
          );
        }}
      >
        <OrganizationFields
          values={values}
          onChange={setValues}
          errors={state.fieldErrors ?? {}}
        />
        {state.error && (
          <p role="alert" className="text-small text-danger-500">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          <SendIcon aria-hidden="true" />
          Kirim ulang pengajuan
        </Button>
      </form>
    </AuthPanel>
  );
}

export { ResubmitForm };
