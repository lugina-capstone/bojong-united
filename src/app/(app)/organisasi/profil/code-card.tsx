"use client";

import { ArrowRightIcon, CheckIcon, RotateCcwIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { regenerateOrganizationCodeAction } from "@/app/(app)/organisasi/actions";
import { ShareCodeButton } from "@/app/(app)/organisasi/_components/share-code-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconBox } from "@/components/ui/icon-box";

/** Kartu Kode organisasi: salin, bagikan, dan buat ulang (kode lama langsung tidak berlaku). */
function CodeCard({
  code,
  organizationName,
  createdAt,
  uses,
}: {
  code: string;
  organizationName: string;
  createdAt: string;
  uses: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function regenerate() {
    startTransition(async () => {
      const result = await regenerateOrganizationCodeAction();
      if (result.error) return void toast.error(result.error);
      toast.success(`Kode baru: ${result.code}`);
      setOpen(false);
    });
  }

  return (
    <section
      id="kode"
      className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-h3 text-foreground">Kode organisasi</h2>
        <Badge tone="success">Aktif</Badge>
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-primary-50 p-4 text-center">
        <p className="font-mono text-display tracking-widest break-all text-primary-600">
          {code}
        </p>
        <p className="text-small text-muted-foreground">
          Dibuat {createdAt} · Dipakai {uses} kali
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CopyButton value={code} />
        <ShareCodeButton code={code} organizationName={organizationName} />
      </div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <RotateCcwIcon aria-hidden="true" />
        Buat ulang kode
      </Button>
      <Alert tone="info">
        Buat ulang kode jika kode tersebar ke pihak yang tidak berhak. Anggota
        yang sudah bergabung tetap aktif.
      </Alert>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox icon={RotateCcwIcon} tone="warning" size="md" />
            <DialogTitle>Buat ulang kode organisasi?</DialogTitle>
            <DialogDescription>
              Kode lama langsung tidak berlaku. Orang yang belum bergabung harus
              memakai kode baru.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-border bg-background p-3 text-small">
            <span className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground">Kode lama</span>
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-small-strong text-label line-through">
                {code}
              </span>
            </span>
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <span className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground">Kode baru</span>
              <span className="text-small-strong text-primary-600">
                Dibuat otomatis
              </span>
            </span>
          </div>
          <p className="flex gap-2 text-small text-label">
            <CheckIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-success-600"
            />
            Anggota yang sudah bergabung tetap aktif.
          </p>
          <Alert tone="warning">
            Undangan yang sudah dibagikan dengan kode lama tidak bisa dipakai
            lagi.
          </Alert>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={regenerate} disabled={pending}>
              <RotateCcwIcon aria-hidden="true" />
              Buat ulang kode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export { CodeCard };
