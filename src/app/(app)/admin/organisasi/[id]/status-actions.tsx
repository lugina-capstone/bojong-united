"use client";

import {
  CircleCheckIcon,
  CircleXIcon,
  PowerIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  disableOrganizationAction,
  enableOrganizationAction,
} from "@/app/(app)/admin/actions";
import { ConsequenceList } from "@/app/(app)/_components/info-rows";
import { Button, buttonVariants } from "@/components/ui/button";
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

/** Kartu bahaya Nonaktifkan / Aktifkan kembali di detail organisasi (PRD-06). */
function OrganizationStatusCard({
  organizationId,
  organizationName,
  disabled,
  deactivatedAt,
  reason,
  memberCount,
  adminCount,
  activeEventCount,
}: {
  organizationId: string;
  organizationName: string;
  disabled: boolean;
  deactivatedAt: string | null;
  reason: string | null;
  memberCount: number;
  adminCount: number;
  activeEventCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!disabled && text.trim().length < 20)
      return setError("Wajib diisi, minimal 20 karakter.");
    startTransition(async () => {
      const result = disabled
        ? await enableOrganizationAction(organizationId)
        : await disableOrganizationAction(organizationId, text);
      if (result.error) return setError(result.error);
      toast.success(
        disabled
          ? `${organizationName} aktif kembali.`
          : `${organizationName} dinonaktifkan.`,
      );
      setOpen(false);
      setText("");
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-card p-4.5 shadow-xs">
      <h2 className="flex items-center gap-2 text-h3 text-danger-700">
        <TriangleAlertIcon aria-hidden="true" className="size-5" />
        {disabled
          ? `Organisasi nonaktif sejak ${deactivatedAt}`
          : "Nonaktifkan organisasi"}
      </h2>
      <p className="text-small text-label">
        {disabled
          ? `${reason ? `Alasan: ${reason} ` : ""}Anggota dapat masuk kembali setelah organisasi diaktifkan.`
          : "Admin dan anggota tidak dapat masuk sampai organisasi diaktifkan kembali. Acara, nilai, dan sertifikat tetap tersimpan."}
      </p>
      <Button
        variant={disabled ? "primary" : "secondary"}
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        <PowerIcon aria-hidden="true" />
        {disabled ? "Aktifkan kembali" : "Nonaktifkan organisasi"}
      </Button>
      {disabled && (
        <Link
          href="/masuk?status=nonaktif&pratinjau=1"
          target="_blank"
          className={buttonVariants({ variant: "secondary" })}
        >
          Lihat layar masuk anggota
        </Link>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <IconBox
                icon={PowerIcon}
                tone={disabled ? "success" : "danger"}
                size="md"
              />
              <DialogTitle>
                {disabled ? "Aktifkan kembali" : "Nonaktifkan"}{" "}
                {organizationName}?
              </DialogTitle>
              <DialogDescription>
                {disabled
                  ? "Anggota dapat masuk ke ruang kerja seperti biasa."
                  : "Organisasi bisa diaktifkan kembali kapan saja."}
              </DialogDescription>
            </DialogHeader>
            <ConsequenceList
              items={
                disabled
                  ? [
                      {
                        icon: CircleCheckIcon,
                        tone: "success",
                        text: `${memberCount} anggota dapat masuk kembali.`,
                      },
                      {
                        icon: CircleCheckIcon,
                        tone: "success",
                        text: "Acara aktif tampil lagi di Jelajah.",
                      },
                    ]
                  : [
                      {
                        icon: CircleXIcon,
                        tone: "danger",
                        text: `${memberCount} anggota (termasuk ${adminCount} admin) tidak dapat masuk.`,
                      },
                      {
                        icon: CircleXIcon,
                        tone: "danger",
                        text: `${activeEventCount} acara aktif disembunyikan dari Jelajah; peserta tidak dapat mengumpulkan tugas.`,
                      },
                      {
                        icon: CircleCheckIcon,
                        tone: "success",
                        text: "Nilai, karya, dan sertifikat peserta tetap tersimpan.",
                      },
                    ]
              }
            />
            {!disabled && (
              <FormField
                id="disable-reason"
                label="Alasan penonaktifan"
                required
                description="Alasan dikirim ke admin organisasi melalui email."
                error={error}
              >
                <Textarea
                  id="disable-reason"
                  rows={3}
                  maxLength={300}
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setError(undefined);
                  }}
                  aria-invalid={Boolean(error)}
                />
              </FormField>
            )}
            {disabled && error && (
              <p role="alert" className="text-small text-danger-500">
                {error}
              </p>
            )}
            <DialogFooter className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant={disabled ? "primary" : "danger"}
                disabled={pending}
              >
                <PowerIcon aria-hidden="true" />
                {disabled ? "Aktifkan" : "Nonaktifkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export { OrganizationStatusCard };
