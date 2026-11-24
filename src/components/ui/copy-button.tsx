"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";

/** Tombol salin teks ke clipboard dengan toast konfirmasi. */
function CopyButton({
  value,
  label = "Salin kode",
  toastMessage = "Kode disalin.",
  iconOnly,
  ...props
}: Omit<ButtonProps, "onClick" | "children"> & {
  value: string;
  label?: string;
  toastMessage?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const Icon = copied ? CheckIcon : CopyIcon;
  return (
    <Button
      type="button"
      variant="secondary"
      aria-label={iconOnly ? label : undefined}
      {...props}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(toastMessage);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <Icon aria-hidden="true" />
      {!iconOnly && label}
    </Button>
  );
}

export { CopyButton };
