"use client";

import { Building2Icon } from "lucide-react";

import { LogoPicker } from "@/app/(auth)/_components/logo-picker";
import { OrgTypeField } from "@/app/(auth)/_components/org-type-field";
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { InputWithIcon } from "@/components/ui/input";
import type { OrganizationType } from "@/generated/prisma/enums";

export type OrganizationValues = {
  organizationType?: OrganizationType;
  organizationName: string;
};

/** Jenis, nama, dan logo organisasi untuk daftar baru dan ajukan ulang. */
function OrganizationFields({
  values,
  onChange,
  errors,
  logo,
  onLogoChange,
}: {
  values: OrganizationValues;
  onChange: (values: OrganizationValues) => void;
  errors: Record<string, string>;
  logo?: File | null;
  onLogoChange?: (file: File | null) => void;
}) {
  return (
    <>
      <OrgTypeField
        value={values.organizationType}
        onChange={(organizationType) =>
          onChange({ ...values, organizationType })
        }
        error={errors.organizationType}
      />
      <FormField
        id="organizationName"
        label="Nama organisasi"
        required
        description="Gunakan nama resmi. Nama ini tampil sebagai penyelenggara di setiap acara."
        error={errors.organizationName}
      >
        <InputWithIcon
          id="organizationName"
          icon={Building2Icon}
          autoComplete="organization"
          placeholder="Contoh: SMK Lugina Rancaekek"
          value={values.organizationName}
          onChange={(event) =>
            onChange({ ...values, organizationName: event.target.value })
          }
          aria-invalid={Boolean(errors.organizationName)}
          aria-describedby={fieldDescribedBy("organizationName", {
            error: errors.organizationName,
            description: true,
          })}
        />
      </FormField>
      {onLogoChange && (
        <LogoPicker
          name={values.organizationName}
          file={logo ?? null}
          onChange={onLogoChange}
        />
      )}
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption-strong tracking-wide text-subtle uppercase">
      {children}
    </p>
  );
}

export { OrganizationFields, SectionLabel };
