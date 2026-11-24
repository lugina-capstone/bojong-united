"use client";

import { CopyIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { copyRubricAction } from "@/app/(app)/ruang-kerja/rubrik/actions";
import { Button } from "@/components/ui/button";

/** Salin rubrik lalu buka salinannya untuk diedit. */
function CopyRubricButton({
  rubricId,
  size = "sm",
}: {
  rubricId: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      variant="secondary"
      size={size}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await copyRubricAction(rubricId);
          if (!result.ok || !result.rubricId)
            return void toast.error(result.error ?? "Rubrik gagal disalin.");
          toast.success("Salinan rubrik dibuat.");
          router.push(`/ruang-kerja/rubrik/${result.rubricId}/edit`);
        })
      }
    >
      <CopyIcon aria-hidden="true" />
      Salin
    </Button>
  );
}

export { CopyRubricButton };
