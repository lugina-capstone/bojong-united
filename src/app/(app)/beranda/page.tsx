import { CompassIcon } from "lucide-react";
import type { Metadata } from "next";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Beranda" };

export default async function BerandaPage() {
  const user = await requireHomeRole(["PESERTA"]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Halo, ${user.name}`}
        description="Pantau acara dan materi yang sedang Anda ikuti."
      />
      <EmptyState
        icon={CompassIcon}
        title="Belum ada acara yang diikuti"
        description="Acara dan materi yang Anda ikuti akan tampil di sini."
      />
    </div>
  );
}
