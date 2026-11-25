"use client";

import { PaperclipIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { saveMaterialPublishAction } from "@/app/(app)/ruang-kerja/materi/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Dialog "Lampirkan ke acara lain" di Detail Materi. */
export function AttachDialog({
  materialId,
  visibility,
  attached,
  events,
}: {
  materialId: string;
  visibility: "PUBLIC" | "EVENT_ONLY";
  attached: string[];
  events: { id: string; title: string; meta: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(attached);
  const [pending, startTransition] = React.useTransition();

  function save() {
    startTransition(async () => {
      const result = await saveMaterialPublishAction(materialId, {
        visibility,
        eventIds: selected,
      });
      if (!result.ok) {
        toast.error(
          result.fieldErrors?.eventIds ?? result.error ?? "Gagal menyimpan.",
        );
        return;
      }
      setOpen(false);
      toast.success("Lampiran acara diperbarui.");
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          setSelected(attached);
          setOpen(true);
        }}
      >
        <PaperclipIcon aria-hidden="true" />
        Lampirkan ke acara lain
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lampirkan ke acara</DialogTitle>
            <DialogDescription>
              Materi tampil sebagai materi pendukung tanpa memengaruhi milestone
              dan nilai acara.
            </DialogDescription>
          </DialogHeader>
          {events.length === 0 ? (
            <p className="text-small text-muted-foreground">
              Belum ada acara aktif di organisasi Anda.
            </p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {events.map((e) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
                    <Checkbox
                      checked={selected.includes(e.id)}
                      onCheckedChange={(next) =>
                        setSelected((list) =>
                          next
                            ? [...list, e.id]
                            : list.filter((id) => id !== e.id),
                        )
                      }
                      aria-label={`Lampirkan ke ${e.title}`}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-small-strong text-foreground">
                        {e.title}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {e.meta}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending} onClick={save}>
              Simpan lampiran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
