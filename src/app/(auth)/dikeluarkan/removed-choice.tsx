"use client";

import {
  ArrowRightIcon,
  Building2Icon,
  CircleCheckIcon,
  ClockIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  LogOutIcon,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import {
  OrganizationFields,
  type OrganizationValues,
} from "@/app/(auth)/_components/organization-fields";
import { SubmittedScreen } from "@/app/(auth)/daftar/organisasi/baru/organization-form";
import { DeleteAccountDialog } from "@/app/(auth)/dikeluarkan/delete-account-dialog";
import {
  continueAsPesertaAction,
  createOrganizationAction,
  type FormState,
  joinOrganizationAction,
  signOutAction,
} from "@/app/(auth)/actions";
import { AuthHeading, AuthPanel } from "@/components/layout/auth-panel";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";

type Choice = "baru" | "gabung" | "peserta";

const CHOICES: {
  value: Choice;
  title: string;
  description: string;
  icon: LucideIcon;
  badge: React.ReactNode;
}[] = [
  {
    value: "baru",
    title: "Buat organisasi baru",
    description:
      "Daftarkan sekolah, lembaga, atau perusahaan dan jadi Admin Organisasi.",
    icon: Building2Icon,
    badge: (
      <Badge tone="neutral">
        <ClockIcon aria-hidden="true" />
        Perlu persetujuan Administrator
      </Badge>
    ),
  },
  {
    value: "gabung",
    title: "Gabung ke organisasi",
    description:
      "Masukkan kode organisasi dari admin, lalu langsung aktif sebagai anggota.",
    icon: KeyRoundIcon,
    badge: (
      <Badge tone="success">
        <CircleCheckIcon aria-hidden="true" />
        Langsung aktif
      </Badge>
    ),
  },
  {
    value: "peserta",
    title: "Masuk sebagai peserta",
    description:
      "Ikuti acara dari organisasi mana pun. Anda tetap bisa membuat atau bergabung ke organisasi nanti.",
    icon: GraduationCapIcon,
    badge: (
      <Badge tone="success">
        <CircleCheckIcon aria-hidden="true" />
        Tanpa kode
      </Badge>
    ),
  },
];

function SignOutLink() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 text-small-medium text-muted-foreground hover:text-foreground"
      >
        <LogOutIcon aria-hidden="true" className="size-4" />
        Keluar dari akun
      </button>
    </form>
  );
}

function RemovedChoice({
  name,
  email,
  organizationName,
  removedAt,
  left,
}: {
  name: string;
  email: string;
  organizationName: string;
  removedAt: string | null;
  /** Keluar sendiri, bukan dikeluarkan admin. */
  left: boolean;
}) {
  const [choice, setChoice] = React.useState<Choice>("baru");
  const [step, setStep] = React.useState<"choose" | Choice | "done">("choose");
  const [organization, setOrganization] = React.useState<OrganizationValues>({
    organizationName: "",
  });
  const [code, setCode] = React.useState("");
  const [state, setState] = React.useState<FormState>({});
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};
  const back = (
    <button
      type="button"
      onClick={() => {
        setState({});
        setStep("choose");
      }}
      className="text-small-medium text-muted-foreground hover:text-foreground"
    >
      ← Kembali ke pilihan
    </button>
  );

  if (step === "done")
    return <SubmittedScreen organizationName={organization.organizationName} />;

  if (step === "baru") {
    return (
      <AuthPanel topStart={back}>
        <AuthHeading
          title="Buat organisasi baru"
          description="Pengajuan ditinjau Administrator sebelum akun Admin Organisasi aktif."
        />
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await createOrganizationAction(organization);
              setState(result);
              if (result.ok) setStep("done");
            });
          }}
        >
          <OrganizationFields
            values={organization}
            onChange={setOrganization}
            errors={errors}
          />
          {state.error && <Alert tone="danger">{state.error}</Alert>}
          <Button type="submit" size="lg" disabled={pending}>
            Kirim pengajuan
          </Button>
        </form>
      </AuthPanel>
    );
  }

  if (step === "gabung") {
    return (
      <AuthPanel topStart={back}>
        <AuthHeading
          title="Gabung ke organisasi"
          description="Masukkan kode organisasi dari admin. Akun langsung aktif sebagai anggota."
        />
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () =>
              setState((await joinOrganizationAction(code)) ?? {}),
            );
          }}
        >
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
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={fieldDescribedBy("code", {
                error: errors.code,
              })}
            />
          </FormField>
          {state.error && <Alert tone="danger">{state.error}</Alert>}
          <Button type="submit" size="lg" disabled={pending}>
            Gabung
          </Button>
        </form>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel topStart={<SignOutLink />}>
      <AuthHeading
        title="Anda tidak lagi tergabung di organisasi"
        description={`Halo ${name}, akun ${email} sudah ${left ? "keluar" : "dikeluarkan"} dari ${organizationName}. Pilih cara melanjutkan dengan akun yang sama.`}
      />
      <Alert tone="warning">
        {left ? "Keluar" : "Dikeluarkan"} dari {organizationName}
        {removedAt && ` pada ${removedAt}`}. Acara dan penilaian yang Anda buat
        tetap tersimpan di organisasi tersebut.
      </Alert>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (choice === "peserta")
            startTransition(() => continueAsPesertaAction());
          else setStep(choice);
        }}
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Cara melanjutkan</legend>
          {CHOICES.map(({ value, title, description, icon: Icon, badge }) => (
            <label
              key={value}
              className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted has-checked:border-primary-500 has-checked:bg-primary-50 has-focus-visible:shadow-focus-ring"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-label">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <span className="text-body-strong text-foreground">
                  {title}
                </span>
                <span className="text-small text-muted-foreground">
                  {description}
                </span>
                {badge}
              </span>
              <input
                type="radio"
                name="choice"
                value={value}
                checked={choice === value}
                onChange={() => setChoice(value)}
                className="mt-1 size-4 shrink-0 accent-primary-500"
              />
            </label>
          ))}
        </fieldset>
        <Alert tone="info">
          Email dan kata sandi tetap sama. Anda tidak perlu membuat akun baru.
        </Alert>
        <Button type="submit" size="lg" disabled={pending}>
          Lanjutkan
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </form>
      <p className="text-center text-small text-muted-foreground">
        Tidak ingin melanjutkan?{" "}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="text-small-strong text-danger-500 hover:underline"
        >
          Hapus akun
        </button>
      </p>
      <DeleteAccountDialog
        email={email}
        organizationName={organizationName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </AuthPanel>
  );
}

export { RemovedChoice };
