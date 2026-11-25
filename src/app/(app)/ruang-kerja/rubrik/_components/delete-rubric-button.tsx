"use client";

import { ArchiveIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { deleteRubricAction } from "@/app/(app)/ruang-kerja/rubrik/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Hapus rubrik; rubrik yang sudah dipakai acara diarsipkan. */
export function DeleteRubricButton({
  rubricId,
  title,
  usedInEvents,
}: {
  rubricId: string;
  title: string;
  usedInEvents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const archive = usedInEvents > 0;
  const Icon = archive ? ArchiveIcon : Trash2Icon;

  function confirm() {
    startTransition(async () => {
      const result = await deleteRubricAction(rubricId);
      if (!result.ok) {
        toast.error(result.error ?? "Rubrik gagal dihapus.");
        return;
      }
      setOpen(false);
      toast.success(result.archived ? "Rubrik diarsipkan." : "Rubrik dihapus.");
      router.push("/ruang-kerja/rubrik");
    });
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Icon aria-hidden="true" />
        {archive ? "Arsipkan rubrik" : "Hapus rubrik"}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archive ? "Arsipkan" : "Hapus"} rubrik “{title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archive
                ? `Rubrik ini dipakai di ${usedInEvents} milestone acara, jadi tidak bisa dihapus. Setelah diarsipkan, rubrik hilang dari daftar dan pilihan wizard, tetapi nilai yang sudah ada tidak berubah.`
                : "Rubrik dan semua kriterianya dihapus permanen. Tindakan ini tidak bisa dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              disabled={pending}
              onClick={confirm}
            >
              {archive ? "Arsipkan" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
