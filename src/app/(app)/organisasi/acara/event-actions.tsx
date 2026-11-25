"use client";

import { RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { transferEventAction } from "@/app/(app)/organisasi/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MemberOption = { value: string; label: string; userId: string };

/** Lihat acara dan alihkan pengelolanya ke anggota aktif lain. */
function EventActions({
  event,
  members,
}: {
  event: { id: string; title: string; creatorId: string };
  members: MemberOption[];
}) {
  const options = members.filter((m) => m.userId !== event.creatorId);
  const [open, setOpen] = React.useState(false);
  const [receiver, setReceiver] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();

  function transfer() {
    if (!receiver) return setError("Pilih anggota penerima.");
    startTransition(async () => {
      const result = await transferEventAction(event.id, receiver);
      if (result.error) return setError(result.error);
      toast.success("Pengelola acara dialihkan.");
      setOpen(false);
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="secondary"
        size="sm"
        nativeButton={false}
        render={<Link href={`/organisasi/acara/${event.id}`} />}
      >
        Lihat
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={options.length === 0}
        title={options.length === 0 ? "Belum ada anggota lain." : undefined}
        onClick={() => {
          setReceiver("");
          setError(undefined);
          setOpen(true);
        }}
      >
        Alihkan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox icon={RefreshCwIcon} tone="neutral" size="md" />
            <DialogTitle>Alihkan pengelola acara</DialogTitle>
            <DialogDescription>
              Pengelola baru mengatur {event.title}, termasuk tugas dan
              penilaiannya. Pengelola lama tidak lagi bisa mengubahnya.
            </DialogDescription>
          </DialogHeader>
          <FormField
            id="pengelola-baru"
            label="Pengelola baru"

            error={error}
          >
            <Select
              items={options}
              value={receiver}
              onValueChange={(value) => {
                setReceiver(String(value ?? ""));
                setError(undefined);
              }}
            >
              <SelectTrigger id="pengelola-baru" className="w-full">
                <SelectValue placeholder="Pilih anggota" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending} onClick={transfer}>
              <RefreshCwIcon aria-hidden="true" />
              Alihkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { EventActions };
