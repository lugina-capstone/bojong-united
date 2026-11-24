"use client";

import { Share2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";

/** Bagikan kode lewat Web Share API; jika tidak tersedia, salin teks undangan. */
function ShareCodeButton({
  code,
  organizationName,
  ...props
}: Omit<ButtonProps, "onClick" | "children"> & {
  code: string;
  organizationName: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      {...props}
      onClick={async () => {
        const text = `Bergabung dengan ${organizationName} di Becraft memakai kode organisasi ${code}.`;
        if (navigator.share) {
          await navigator
            .share({ title: "Kode organisasi", text })
            .catch(() => undefined);
          return;
        }
        await navigator.clipboard.writeText(text);
        toast.success("Teks undangan disalin.");
      }}
    >
      <Share2Icon aria-hidden="true" />
      Bagikan
    </Button>
  );
}

export { ShareCodeButton };
