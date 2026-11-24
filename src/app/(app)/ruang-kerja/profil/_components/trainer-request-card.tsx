"use client";

import { BookOpenIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  cancelTrainerRequestAction,
  requestTrainerAction,
} from "@/app/(app)/ruang-kerja/profil/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Request = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  plannedMaterial: string;
  rejectionReason: string | null;
};

export function TrainerRequestCard({
  organizationName,
  request,
}: {
  organizationName: string;
  request: Request | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [material, setMaterial] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const res = await requestTrainerAction(material);
      if (res.ok) {
        setOpen(false);
        setMaterial("");
        toast.success("Pengajuan Trainer terkirim.");
      } else setError(res.error);
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      const res = await cancelTrainerRequestAction(id);
      if (res.ok) toast.success("Pengajuan Trainer dibatalkan.");
      else toast.error(res.error ?? "Gagal membatalkan pengajuan.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {request?.status === "PENDING" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="warning" size="sm">
            Trainer · Menunggu persetujuan
          </Badge>
          <Button
            variant="link"
            size="sm"
            className="px-0 text-danger-700"
            disabled={pending}
            onClick={() => cancel(request.id)}
          >
            Batalkan pengajuan
          </Button>
        </div>
      ) : (
        <>
          {request?.status === "REJECTED" && (
            <p className="rounded-lg bg-danger-50 p-3 text-caption text-danger-700">
              Pengajuan sebelumnya ditolak
              {request.rejectionReason ? `: ${request.rejectionReason}` : "."}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="w-fit"
            onClick={() => {
              setError(undefined);
              setOpen(true);
            }}
          >
            <BookOpenIcon aria-hidden="true" />
            {request?.status === "REJECTED"
              ? "Ajukan Trainer lagi"
              : "Ajukan akses Trainer"}
          </Button>
        </>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan akses Trainer?</DialogTitle>
            <DialogDescription>
              Trainer dapat mengunggah materi pembelajaran. Semua fitur Guru
              tetap bisa Anda pakai.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 text-small text-label">
            <li className="flex gap-2">
              <CheckCircle2Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-success-600"
              />
              Unggah materi mandiri: berkas maks. 10 MB, atau tautan.
            </li>
            <li className="flex gap-2">
              <CheckCircle2Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-primary-600"
              />
              Lampirkan materi ke acara di {organizationName}.
            </li>
            <li className="flex gap-2">
              <InfoIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-primary-600"
              />
              Pengajuan ditinjau oleh Admin Organisasi {organizationName}.
            </li>
          </ul>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="planned-material">Materi yang akan diunggah</Label>
            <Input
              id="planned-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Contoh: Dasar UI/UX untuk kelas XI RPL"
              aria-invalid={Boolean(error)}
            />
            <span
              className={
                error
                  ? "text-caption text-danger-700"
                  : "text-caption text-muted-foreground"
              }
            >
              {error ?? "Membantu admin memahami kebutuhan Anda."}
            </span>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending} onClick={submit}>
              Kirim pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
