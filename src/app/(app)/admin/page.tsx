import { ClipboardCheckIcon } from "lucide-react";
import type { Metadata } from "next";

import { requireHomeRole } from "@/app/(app)/home-guard";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Administrator" };

export default async function AdminPage() {
  await requireHomeRole(["ADMINISTRATOR"]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Beranda Administrator"
        description="Tinjau pengajuan organisasi dan pantau pengguna Becraft."
      />
      <EmptyState
        icon={ClipboardCheckIcon}
        title="Belum ada pengajuan"
        description="Pengajuan organisasi baru akan tampil di sini."
      />
    </div>
  );
}
