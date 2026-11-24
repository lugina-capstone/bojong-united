"use client";

import { UploadIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
import { logoContentTypes, MAX_LOGO_SIZE } from "@/lib/validations/auth";

async function isSquare(file: File) {
  const bitmap = await createImageBitmap(file);
  const square = bitmap.width === bitmap.height;
  bitmap.close();
  return square;
}

/** Logo organisasi opsional: PNG/JPG, maks. 2 MB, rasio 1:1. Diupload setelah email terverifikasi. */
function LogoPicker({
  name,
  file,
  onChange,
}: {
  name: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string>();
  const preview = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function pick(selected: File | undefined) {
    if (!selected) return;
    setError(undefined);
    if (!(logoContentTypes as readonly string[]).includes(selected.type))
      return setError("Logo harus berformat PNG atau JPG.");
    if (selected.size > MAX_LOGO_SIZE)
      return setError("Ukuran logo maksimal 2 MB.");
    if (!(await isSquare(selected)))
      return setError("Logo harus persegi (rasio 1:1).");
    onChange(selected);
  }

  return (
    <div className="flex items-start gap-3">
      <OrgLogo name={name || "Organisasi"} src={preview} className="size-12" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon aria-hidden="true" />
            {file ? "Ganti logo" : "Unggah logo (opsional)"}
          </Button>
          {file && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
            >
              <XIcon aria-hidden="true" />
              Hapus
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={logoContentTypes.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Logo organisasi"
          onChange={(event) => {
            void pick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {error ? (
          <p role="alert" className="text-caption text-danger-500">
            {error}
          </p>
        ) : (
          <p className="text-caption text-muted-foreground">
            PNG atau JPG, persegi 1:1, maks. 2 MB. Bisa diunggah nanti di Profil
            organisasi.
          </p>
        )}
      </div>
    </div>
  );
}

/** Upload logo lewat URL sementara lalu pasang ke organisasi pemohon. */
async function uploadOrganizationLogo(
  file: File,
  attach: (fileId: string) => Promise<{ ok: boolean }>,
) {
  const response = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });
  if (!response.ok) return false;
  const { file: created, upload } = (await response.json()) as {
    file: { id: string };
    upload: { url: string; headers: Record<string, string> };
  };
  const put = await fetch(upload.url, {
    method: "PUT",
    headers: upload.headers,
    body: file,
  });
  if (!put.ok) return false;
  const complete = await fetch(`/api/files/${created.id}/complete`, {
    method: "POST",
  });
  if (!complete.ok) return false;
  return (await attach(created.id)).ok;
}

export { LogoPicker, uploadOrganizationLogo };
