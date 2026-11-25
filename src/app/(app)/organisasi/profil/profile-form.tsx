"use client";

import {
  Building2Icon,
  MailIcon,
  PhoneIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  logoImageError,
  uploadOrganizationLogo,
} from "@/app/(auth)/_components/logo-picker";
import {
  updateOrganizationLogoAction,
  updateOrganizationProfileAction,
} from "@/app/(app)/organisasi/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";
import { OrgLogo } from "@/components/ui/org-logo";
import { ORG_TYPES } from "@/components/ui/org-type-selected";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationType } from "@/generated/prisma/enums";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  logoContentTypes,
  MAX_LOGO_SIZE,
  organizationTypes,
} from "@/lib/validations/auth";

const TYPE_OPTIONS = organizationTypes.map((value) => ({
  value,
  label: ORG_TYPES[value].label,
}));

type Values = {
  name: string;
  type: OrganizationType;
  contactEmail: string;
  contactPhone: string;
};

/** Data organisasi (PRD-05): logo, nama, jenis, kontak. */
function ProfileForm({
  initial,
  logoUrl,
}: {
  initial: Values;
  logoUrl: string | null;
}) {
  const [values, setValues] = React.useState(initial);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [logoError, setLogoError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function pickLogo(file: File | undefined) {
    if (!file) return;
    setLogoError(undefined);
    if (!(logoContentTypes as readonly string[]).includes(file.type))
      return setLogoError(
        `Berkas ${file.name} bukan PNG atau JPG. Pilih berkas lain.`,
      );
    if (file.size > MAX_LOGO_SIZE)
      return setLogoError(
        `Berkas ${file.name} ${formatFileSize(file.size)} melebihi batas 2 MB. Pilih berkas lain.`,
      );
    const imageError = await logoImageError(file);
    if (imageError) return setLogoError(imageError);
    setUploading(true);
    const ok = await uploadOrganizationLogo(file, (id) =>
      updateOrganizationLogoAction(id).then((result) => ({
        ok: Boolean(result.ok),
      })),
    );
    setUploading(false);
    if (ok) toast.success("Logo organisasi diperbarui.");
    else setLogoError("Logo gagal diunggah. Coba lagi.");
  }

  function removeLogo() {
    startTransition(async () => {
      const result = await updateOrganizationLogoAction(null);
      if (result.ok) toast.success("Logo organisasi dihapus.");
      else toast.error(result.error ?? "Logo gagal dihapus.");
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateOrganizationProfileAction(values);
      setErrors(result.fieldErrors ?? {});
      if (result.ok) toast.success("Profil organisasi disimpan.");
      else if (result.error) toast.error(result.error);
    });
  }

  const set =
    (key: keyof Values) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues({ ...values, [key]: event.target.value });

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <OrgLogo
          name={values.name || "Organisasi"}
          src={logoUrl}
          className={cn(
            "size-16 rounded-xl text-h3",
            logoError && "ring-2 ring-danger-500",
          )}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon aria-hidden="true" />
              {uploading
                ? "Mengunggah…"
                : logoUrl
                  ? "Ganti logo"
                  : "Unggah logo"}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger-500"
                disabled={pending}
                onClick={removeLogo}
              >
                <Trash2Icon aria-hidden="true" />
                Hapus
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={logoContentTypes.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-label="Logo organisasi"
            onChange={(event) => {
              void pickLogo(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {logoError ? (
            <p role="alert" className="text-caption text-danger-500">
              {logoError}
            </p>
          ) : (
            <p className="text-caption text-muted-foreground">
              PNG atau JPG · maks. 2 MB · rasio 1:1. Logo tampil di sidebar dan
              label penyelenggara.
            </p>
          )}
        </div>
      </div>
      <FormField
        id="org-name"
        label="Nama organisasi"
        required
        error={errors.name}
      >
        <InputWithIcon
          id="org-name"
          icon={Building2Icon}
          value={values.name}
          onChange={set("name")}
          aria-invalid={Boolean(errors.name)}
        />
      </FormField>
      <FormField
        id="org-type"
        label="Jenis organisasi"
        required
        error={errors.type}
      >
        <Select
          items={TYPE_OPTIONS}
          value={values.type}
          onValueChange={(type) =>
            type && setValues({ ...values, type: type as OrganizationType })
          }
        >
          <SelectTrigger
            id="org-type"
            className="w-full"
            aria-invalid={Boolean(errors.type)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="org-email"
          label="Email kontak"
          error={errors.contactEmail}
        >
          <InputWithIcon
            id="org-email"
            type="email"
            icon={MailIcon}
            value={values.contactEmail}
            onChange={set("contactEmail")}
            aria-invalid={Boolean(errors.contactEmail)}
          />
        </FormField>
        <FormField
          id="org-phone"
          label="Telepon kontak"
          error={errors.contactPhone}
        >
          <InputWithIcon
            id="org-phone"
            type="tel"
            icon={PhoneIcon}
            value={values.contactPhone}
            onChange={set("contactPhone")}
            aria-invalid={Boolean(errors.contactPhone)}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setValues(initial);
            setErrors({});
          }}
        >
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}

export { ProfileForm };
