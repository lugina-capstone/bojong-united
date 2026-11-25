"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

/** Toast sekali setelah materi diterbitkan (?terbit=id). */
export function PublishedToast({ title }: { title: string }) {
  const router = useRouter();
  React.useEffect(() => {
    toast.success(`“${title}” diterbitkan dan siap diikuti peserta.`);
    router.replace("/ruang-kerja/materi");
  }, [title, router]);
  return null;
}
