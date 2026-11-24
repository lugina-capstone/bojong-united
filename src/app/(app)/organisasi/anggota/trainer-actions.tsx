"use client";

import { BookOpenIcon, CircleCheckIcon, CircleXIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { reviewTrainerRequestAction } from "@/app/(app)/organisasi/actions";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";

/** Setujui / tolak pengajuan Trainer (PRD-05). Tolak wajib alasan. */
function TrainerRequestActions({
  requestId,
  name,
  currentRole,
}: {
  requestId: string;
  name: string;
  currentRole: string;
}) {
  const [dialog, setDialog] = React.useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();
  const firstName = name.split(" ")[0];

  function review(decision: "approve" | "reject") {
    if (decision === "reject" && reason.trim().length < 5)
      return setError("Wajib diisi, minimal 5 karakter.");
    startTransition(async () => {
      const result = await reviewTrainerRequestAction(
        requestId,
        decision,
        reason,
      );
      if (result.error) {
        if (decision === "reject") setError(result.error);
        else toast.error(result.error);
        return;
      }
      toast.success(
        decision === "approve"
          ? `${name} kini Trainer.`
          : `Pengajuan ${name} ditolak.`,
      );
      setDialog(null);
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={() => setDialog("reject")}>
        Tolak
      </Button>
      <Button size="sm" onClick={() => setDialog("approve")}>
        Setujui
      </Button>

      <Dialog
        open={dialog === "approve"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox icon={BookOpenIcon} tone="success" size="md" />
            <DialogTitle>Setujui {name} menjadi Trainer?</DialogTitle>
            <DialogDescription>
              {firstName} mendapat menu Materi untuk mengunggah materi
              pembelajaran, selain fitur {currentRole}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button disabled={pending} onClick={() => review("approve")}>
              <CircleCheckIcon aria-hidden="true" />
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "reject"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              review("reject");
            }}
          >
            <DialogHeader>
              <IconBox icon={CircleXIcon} tone="danger" size="md" />
              <DialogTitle>Tolak pengajuan {name}?</DialogTitle>
              <DialogDescription>
                {firstName} tetap menjadi {currentRole} dan dapat mengajukan
                lagi nanti.
              </DialogDescription>
            </DialogHeader>
            <FormField
              id={`trainer-reason-${requestId}`}
              label="Alasan penolakan"
              required
              description={`Alasan ini dikirim ke ${firstName} lewat notifikasi.`}
              error={error}
            >
              <Input
                id={`trainer-reason-${requestId}`}
                maxLength={300}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError(undefined);
                }}
                aria-invalid={Boolean(error)}
              />
            </FormField>
            <DialogFooter className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialog(null)}
              >
                Batal
              </Button>
              <Button type="submit" variant="danger" disabled={pending}>
                Tolak pengajuan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { TrainerRequestActions };
