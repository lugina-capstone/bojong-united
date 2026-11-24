"use client";

import { CircleCheckIcon } from "lucide-react";

import type { OrganizationType } from "@/generated/prisma/enums";
import { ORG_TYPES } from "@/components/ui/org-type-selected";
import { organizationTypes } from "@/lib/validations/auth";

/** Pilihan jenis organisasi berbentuk kartu (radio native agar bisa dipakai keyboard). */
function OrgTypeField({
  value,
  onChange,
  error,
}: {
  value?: OrganizationType;
  onChange: (value: OrganizationType) => void;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-small-strong text-label">
        Jenis organisasi
        <span aria-hidden="true" className="ml-0.5 text-danger-500">
          *
        </span>
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {organizationTypes.map((type) => {
          const { label, icon: Icon } = ORG_TYPES[type];
          return (
            <label
              key={type}
              className="flex h-10.5 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-body text-label transition-colors hover:bg-muted has-checked:border-primary-500 has-checked:bg-primary-50 has-checked:text-primary-500 has-focus-visible:shadow-focus-ring"
            >
              <input
                type="radio"
                name="organizationType"
                value={type}
                checked={value === type}
                onChange={() => onChange(type)}
                className="peer sr-only"
              />
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">{label}</span>
              <CircleCheckIcon
                aria-hidden="true"
                className="hidden size-4 shrink-0 peer-checked:block"
              />
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-caption text-danger-500">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export { OrgTypeField };
