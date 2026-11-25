"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { enrollMaterialAction } from "@/app/(app)/materi/actions";
import { Button } from "@/components/ui/button";

/** Ikuti materi lalu langsung buka ruang belajar. */
export function EnrollButton({
  materialId,
  className,
  size,
}: {
  materialId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      className={className}
      size={size}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await enrollMaterialAction(materialId);
          if (!result.ok) {
            toast.error(result.error ?? "Gagal mengikuti materi.");
            return;
          }
          toast.success("Materi diikuti. Selamat belajar!");
          router.push(`/materi/${materialId}`);
        })
      }
    >
      <PlusIcon aria-hidden="true" />
      Ikuti materi
    </Button>
  );
}
