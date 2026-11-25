import { SearchXIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchXIcon}
      title="Halaman tidak ditemukan"
      description="Halaman yang Anda cari tidak ada atau Anda tidak memiliki akses."
      action={
        <Button nativeButton={false} render={<Link href="/" />}>
          Kembali ke beranda
        </Button>
      }
    />
  );
}
