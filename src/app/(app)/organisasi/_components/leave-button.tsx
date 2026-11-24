"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  LogOutIcon,
  RefreshCwIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ConsequenceList } from "@/app/(app)/_components/info-rows";
import { leaveOrganizationAction } from "@/app/(app)/organisasi/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconBox } from "@/components/ui/icon-box";

/** Keluar dari organisasi. Admin terakhir tidak dapat keluar (dicek juga di server). */
function LeaveOrganizationButton({
  organizationName,
  otherAdmin,
}: {
  organizationName: string;
  otherAdmin: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const lastAdmin = otherAdmin === null;

  function leave() {
    startTransition(async () => {
      const result = await leaveOrganizationAction();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        className="w-full text-danger-500"
        onClick={() => setOpen(true)}
      >
        <LogOutIcon aria-hidden="true" />
        Keluar dari organisasi
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox icon={LogOutIcon} tone="warning" size="md" />
            <DialogTitle>Keluar dari {organizationName}?</DialogTitle>
            <DialogDescription>
              Anda akan kehilangan akses ke ruang kerja dan pengelolaan
              organisasi.
            </DialogDescription>
          </DialogHeader>
          {lastAdmin ? (
            <Alert tone="warning" title="Admin terakhir tidak dapat keluar">
              Jika Anda satu-satunya admin, jadikan anggota lain admin terlebih
              dahulu.
            </Alert>
          ) : (
            <ConsequenceList
              items={[
                {
                  icon: CircleCheckIcon,
                  tone: "success",
                  text: `Organisasi masih punya admin lain (${otherAdmin}).`,
                },
                {
                  icon: RefreshCwIcon,
                  tone: "info",
                  text: "Acara yang Anda kelola dialihkan ke admin lain.",
                },
                {
                  icon: InfoIcon,
                  tone: "info",
                  text: "Saat masuk lagi, Anda dapat membuat organisasi, bergabung dengan kode, atau masuk sebagai peserta.",
                },
              ]}
            />
          )}
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={leave}
              disabled={pending || lastAdmin}
            >
              <LogOutIcon aria-hidden="true" />
              Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { LeaveOrganizationButton };
