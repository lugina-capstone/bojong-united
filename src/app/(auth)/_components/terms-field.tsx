"use client";

import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";

function TermsField({
  checked,
  onCheckedChange,
  error,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-2.5 text-small text-muted-foreground">
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={Boolean(error)}
          className="mt-0.5"
        />
        <span>
          Saya menyetujui{" "}
          <Link
            href="/ketentuan"
            target="_blank"
            rel="noopener"
            className="text-small-strong text-primary-500"
          >
            Ketentuan Layanan
          </Link>{" "}
          dan{" "}
          <Link
            href="/privasi"
            target="_blank"
            rel="noopener"
            className="text-small-strong text-primary-500"
          >
            Kebijakan Privasi
          </Link>
          .
        </span>
      </label>
      {error && (
        <p role="alert" className="text-caption text-danger-500">
          {error}
        </p>
      )}
    </div>
  );
}

export { TermsField };
