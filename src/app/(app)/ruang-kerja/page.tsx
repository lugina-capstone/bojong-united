import { CalendarPlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Ruang Kerja" };

export default async function RuangKerjaPage() {
  const user = await requireHomeRole(["GURU", "ASESOR", "TRAINER"]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Halo, ${user.name}`}
        description={`Ruang kerja ${user.membership?.organization.name ?? ""}`}
      />
      <EmptyState
        icon={CalendarPlusIcon}
        title="Belum ada acara"
        description="Acara yang Anda buat atau nilai akan tampil di sini."
      />
    </div>
  );
}
