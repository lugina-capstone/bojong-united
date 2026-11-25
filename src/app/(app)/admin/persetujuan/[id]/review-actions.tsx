"use client";

import { CheckIcon, CircleCheckIcon, CircleXIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  approveOrganizationAction,
  rejectOrganizationAction,
} from "@/app/(app)/admin/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChipGroup } from "@/components/ui/choice-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";
import { Textarea } from "@/components/ui/textarea";

const QUICK_REASONS = {
  "Nama tidak resmi":
    "Nama organisasi tidak sesuai dengan nama resmi. Mohon gunakan nama resmi organisasi.",
  "Domain email tidak sesuai":
    "Email pemohon tidak memakai domain resmi organisasi. Mohon ajukan dengan email institusi.",
  "Organisasi sudah terdaftar":
    "Organisasi ini sudah terdaftar di Becraft. Hubungi admin organisasi untuk bergabung.",
  "Data tidak lengkap":
    "Data organisasi belum lengkap. Mohon lengkapi jenis, nama, dan kontak organisasi.",
};

/** Tombol Tolak + Setujui di detail pengajuan beserta dialog konfirmasinya. */
function ReviewActions({
  organizationId,
  organizationName,
  applicantName,
  applicantEmail,
  code,
}: {
  organizationId: string;
  organizationName: string;
  applicantName: string;
  applicantEmail: string;
  code: string;
}) {
  const [dialog, setDialog] = React.useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = React.useState("");
  const [chip, setChip] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();

  function close(open: boolean) {
    if (!open) setDialog(null);
  }

  function approve() {
    startTransition(async () => {
      const result = await approveOrganizationAction(organizationId);
      if (result.error) return void toast.error(result.error);
      toast.success(`${organizationName} disetujui.`);
      setDialog(null);
    });
  }

  function reject(event: React.FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 20)
      return setError("Wajib diisi, minimal 20 karakter.");
    startTransition(async () => {
      const result = await rejectOrganizationAction(organizationId, reason);
      if (result.error) return setError(result.error);
      toast.success(`Pengajuan ${organizationName} ditolak.`);
      setDialog(null);
    });
  }

  function withCounter(text: string) {
    return (
      <span className="flex justify-between gap-2">
        <span className="min-w-0">{text}</span>
        <span className="shrink-0 text-muted-foreground">
          {reason.length}/300
        </span>
      </span>
    );
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setDialog("reject")}>
        <CircleXIcon aria-hidden="true" />
        Tolak
      </Button>
      <Button onClick={() => setDialog("approve")}>
        <CircleCheckIcon aria-hidden="true" />
        Setujui organisasi
      </Button>

      <Dialog open={dialog === "approve"} onOpenChange={close}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox icon={CircleCheckIcon} tone="success" size="md" />
            <DialogTitle>Setujui {organizationName}?</DialogTitle>
            <DialogDescription>
              Pastikan data sudah ditinjau. Setelah disetujui:
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
            {[
              `${applicantName} menjadi Admin Organisasi.`,
              `Kode organisasi ${code} langsung dapat dibagikan.`,
              `Email persetujuan dikirim ke ${applicantEmail}.`,
            ].map((text) => (
              <li key={text} className="flex gap-2 text-small text-label">
                <CheckIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-success-600"
                />
                <span className="min-w-0 break-words">{text}</span>
              </li>
            ))}
          </ul>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button onClick={approve} disabled={pending}>
              <CircleCheckIcon aria-hidden="true" />
              Setujui organisasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reject"} onOpenChange={close}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <form onSubmit={reject} className="flex flex-col gap-4">
            <DialogHeader>
              <IconBox icon={CircleXIcon} tone="danger" size="md" />
              <DialogTitle>Tolak pengajuan {organizationName}?</DialogTitle>
              <DialogDescription>
                Alasan dikirim ke {applicantEmail} dan ditampilkan saat pemohon
                mencoba masuk.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <p className="text-small-strong text-label">Alasan cepat</p>
              <ChoiceChipGroup
                value={chip}
                onValueChange={(value) => {
                  const next = (value as string[]).slice(-1);
                  setChip(next);
                  const key = next[0] as keyof typeof QUICK_REASONS | undefined;
                  if (key) {
                    setReason(QUICK_REASONS[key]);
                    setError(undefined);
                  }
                }}
                className="flex flex-wrap gap-2"
              >
                {Object.keys(QUICK_REASONS).map((label) => (
                  <ChoiceChip key={label} value={label}>
                    {label}
                  </ChoiceChip>
                ))}
              </ChoiceChipGroup>
            </div>
            <FormField
              id="reject-reason"
              label="Alasan penolakan"
              required
              description={withCounter("Wajib diisi, minimal 20 karakter.")}
              error={error && withCounter(error)}
            >
              <Textarea
                id="reject-reason"
                rows={3}
                maxLength={300}
                className="resize-none"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError(undefined);
                }}
                aria-invalid={Boolean(error)}
              />
            </FormField>
            <Alert tone="info">
              Pemohon dapat memperbaiki data lalu mengajukan ulang. Data
              sebelumnya terisi otomatis.
            </Alert>
            <DialogFooter className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialog(null)}
              >
                Batal
              </Button>
              <Button type="submit" variant="danger" disabled={pending}>
                <CircleXIcon aria-hidden="true" />
                Tolak pengajuan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { ReviewActions };
