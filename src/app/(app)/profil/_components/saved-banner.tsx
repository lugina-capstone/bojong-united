"use client";

import { CircleCheckIcon, XIcon } from "lucide-react";
import * as React from "react";

/** Banner konfirmasi pembaruan profil yang dapat ditutup. */
export function SavedProfileBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 p-4"
    >
      <CircleCheckIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-success-600"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-strong text-success-600">
          Profil berhasil diperbarui!
        </p>
        <p className="text-small text-text-secondary">
          Perubahan Anda telah tersimpan dan langsung tampil di aplikasi serta
          e-sertifikat acara mendatang.
        </p>
      </div>
      <button
        type="button"
        aria-label="Tutup pemberitahuan"
        onClick={() => setDismissed(true)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-success-700 outline-none hover:bg-success-100 focus-visible:shadow-focus-ring"
      >
        <XIcon aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
