import { cn } from "cn";
import {
  BriefcaseIcon,
  Building2Icon,
  CircleCheckIcon,
  GraduationCapIcon,
  LandmarkIcon,
  type LucideIcon,
} from "lucide-react";

import type { OrganizationType } from "@/generated/prisma/enums";

const ORG_TYPES: Record<OrganizationType, { label: string; icon: LucideIcon }> =
  {
    SEKOLAH_UNIVERSITAS: {
      label: "Sekolah/Universitas",
      icon: GraduationCapIcon,
    },
    LEMBAGA: { label: "Lembaga", icon: LandmarkIcon },
    PERUSAHAAN: { label: "Perusahaan", icon: BriefcaseIcon },
    INSTANSI_LAINNYA: { label: "Instansi lainnya", icon: Building2Icon },
  };

/** Ringkasan jenis organisasi yang sudah dipilih di formulir daftar organisasi. */
function OrgTypeSelected({
  type,
  className,
}: {
  type: OrganizationType;
  className?: string;
}) {
  const { label, icon: Icon } = ORG_TYPES[type];
  return (
    <div
      data-slot="org-type-selected"
      className={cn(
        "flex h-10.5 items-center gap-2 rounded-lg border border-primary-500 bg-primary-50 px-3 text-primary-500",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 text-body-strong">{label}</span>
      <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
    </div>
  );
}

export { OrgTypeSelected, ORG_TYPES };
