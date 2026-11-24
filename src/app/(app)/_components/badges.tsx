import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  BanIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ORG_TYPES } from "@/components/ui/org-type-selected";
import type {
  MemberRole,
  OrganizationStatus,
  OrganizationType,
} from "@/generated/prisma/enums";
import { roleLabels } from "@/lib/rbac";

const ORG_STATUS: Record<
  OrganizationStatus,
  {
    label: string;
    tone: "warning" | "success" | "danger" | "neutral";
    icon: typeof ClockIcon;
  }
> = {
  PENDING: { label: "Menunggu", tone: "neutral", icon: ClockIcon },
  APPROVED: { label: "Aktif", tone: "success", icon: CircleCheckIcon },
  REJECTED: { label: "Ditolak", tone: "danger", icon: CircleXIcon },
  DISABLED: { label: "Nonaktif", tone: "danger", icon: BanIcon },
};

function OrgStatusBadge({
  status,
  label,
}: {
  status: OrganizationStatus;
  label?: string;
}) {
  const { tone, icon: Icon, label: fallback } = ORG_STATUS[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden="true" />
      {label ?? fallback}
    </Badge>
  );
}

function OrgTypeBadge({ type }: { type: OrganizationType }) {
  const { label, icon: Icon } = ORG_TYPES[type];
  return (
    <Badge tone="neutral">
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

function orgTypeLabel(type: OrganizationType) {
  return ORG_TYPES[type].label;
}

function RoleBadge({ role }: { role: MemberRole }) {
  return <Badge tone="neutral">{roleLabels[role]}</Badge>;
}

function AdminBadge({ label = "Admin" }: { label?: string }) {
  return (
    <Badge tone="primary">
      <ShieldCheckIcon aria-hidden="true" />
      {label}
    </Badge>
  );
}

function PesertaBadge() {
  return (
    <Badge tone="success">
      <GraduationCapIcon aria-hidden="true" />
      Peserta
    </Badge>
  );
}

export {
  AdminBadge,
  OrgStatusBadge,
  OrgTypeBadge,
  orgTypeLabel,
  PesertaBadge,
  RoleBadge,
};
