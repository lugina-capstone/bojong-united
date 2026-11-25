"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BookOpenIcon,
  EllipsisIcon,
  HistoryIcon,
  InfoIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ConsequenceList } from "@/app/(app)/_components/info-rows";
import {
  archiveMaterialAction,
  deleteMaterialAction,
  restoreMaterialAction,
} from "@/app/(app)/ruang-kerja/materi/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconBox } from "@/components/ui/icon-box";
import { MenuItem } from "@/components/ui/menu-item";
import type { MaterialStatus } from "@/generated/prisma/enums";

type Kind = "archive" | "delete" | "blocked" | null;

/** Aksi kelola materi: arsipkan, pulihkan, hapus (atau sarankan arsip jika sudah diikuti). */
function useMaterialActions({
  id,
  title,
  learners,
  afterDelete,
}: {
  id: string;
  title: string;
  learners: number;
  afterDelete?: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<Kind>(null);
  const [pending, startTransition] = React.useTransition();

  function archive() {
    startTransition(async () => {
      const result = await archiveMaterialAction(id);
      if (!result.ok) return void toast.error(result.error ?? "Gagal.");
      setDialog(null);
      toast.success("Materi diarsipkan.");
    });
  }
  function restore() {
    startTransition(async () => {
      const result = await restoreMaterialAction(id);
      if (!result.ok) return void toast.error(result.error ?? "Gagal.");
      toast.success("Materi diterbitkan kembali.");
    });
  }
  function remove() {
    startTransition(async () => {
      const result = await deleteMaterialAction(id);
      if (result.archiveSuggested) return setDialog("blocked");
      if (!result.ok) return void toast.error(result.error ?? "Gagal.");
      setDialog(null);
      toast.success("Materi dihapus.");
      if (afterDelete) router.push(afterDelete);
    });
  }

  const askDelete = () => setDialog(learners > 0 ? "blocked" : "delete");

  const dialogs = (
    <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
      <DialogContent>
        {dialog === "archive" && (
          <>
            <DialogHeader>
              <IconBox icon={ArchiveIcon} tone="warning" size="md" />
              <DialogTitle>Arsipkan “{title}”?</DialogTitle>
              <DialogDescription>
                Materi tidak tampil di Jelajah dan tidak bisa diikuti lagi.
              </DialogDescription>
            </DialogHeader>
            <ConsequenceList
              items={[
                {
                  icon: HistoryIcon,
                  tone: "success",
                  text: "Riwayat belajar peserta tetap tersimpan.",
                },
                {
                  icon: BookOpenIcon,
                  tone: "info",
                  text: "Peserta yang sudah mengikuti tetap bisa membuka materi.",
                },
              ]}
            />
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Batal
              </Button>
              <Button disabled={pending} onClick={archive}>
                <ArchiveIcon aria-hidden="true" />
                Arsipkan materi
              </Button>
            </DialogFooter>
          </>
        )}
        {dialog === "delete" && (
          <>
            <DialogHeader>
              <IconBox icon={Trash2Icon} tone="danger" size="md" />
              <DialogTitle>Hapus “{title}”?</DialogTitle>
              <DialogDescription>
                Materi dan seluruh bagiannya dihapus permanen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Batal
              </Button>
              <Button variant="danger" disabled={pending} onClick={remove}>
                <Trash2Icon aria-hidden="true" />
                Hapus materi
              </Button>
            </DialogFooter>
          </>
        )}
        {dialog === "blocked" && (
          <>
            <DialogHeader>
              <IconBox icon={Trash2Icon} tone="danger" size="md" />
              <DialogTitle>Materi tidak dapat dihapus</DialogTitle>
              <DialogDescription>
                {title} sudah di-enroll {learners} peserta.
              </DialogDescription>
            </DialogHeader>
            <ConsequenceList
              items={[
                {
                  icon: HistoryIcon,
                  tone: "success",
                  text: "Riwayat belajar peserta harus tetap tersimpan.",
                },
                {
                  icon: ArchiveIcon,
                  tone: "warning",
                  text: "Arsipkan agar materi tidak tampil di Jelajah dan tidak bisa di-enroll lagi.",
                },
                {
                  icon: InfoIcon,
                  tone: "info",
                  text: "Hapus hanya tersedia untuk materi yang belum pernah di-enroll.",
                },
              ]}
            />
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Batal
              </Button>
              <Button disabled={pending} onClick={archive}>
                <ArchiveIcon aria-hidden="true" />
                Arsipkan materi
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return { setDialog, askDelete, restore, pending, dialogs };
}

/** Menu titik tiga di tabel Materi. */
function MaterialMenu({
  id,
  title,
  status,
  learners,
}: {
  id: string;
  title: string;
  status: MaterialStatus;
  learners: number;
}) {
  const router = useRouter();
  const { setDialog, askDelete, restore, dialogs } = useMaterialActions({
    id,
    title,
    learners,
  });
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Kelola ${title}`}
          render={<Button variant="secondary" size="icon-sm" />}
        >
          <EllipsisIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <MenuItem
            icon={PencilIcon}
            label={status === "DRAFT" ? "Lanjutkan draf" : "Edit materi"}
            onClick={() => router.push(`/ruang-kerja/materi/${id}/edit`)}
          />
          {status === "PUBLISHED" && (
            <MenuItem
              icon={ArchiveIcon}
              label="Arsipkan"
              onClick={() => setDialog("archive")}
            />
          )}
          {status === "ARCHIVED" && (
            <MenuItem
              icon={ArchiveRestoreIcon}
              label="Terbitkan kembali"
              onClick={restore}
            />
          )}
          <DropdownMenuSeparator />
          <MenuItem
            icon={Trash2Icon}
            label="Hapus"
            danger
            onClick={askDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </>
  );
}

/** Tombol Arsipkan/Pulihkan dan Hapus di Detail Materi. */
function MaterialDetailActions({
  id,
  title,
  status,
  learners,
}: {
  id: string;
  title: string;
  status: MaterialStatus;
  learners: number;
}) {
  const { setDialog, askDelete, restore, pending, dialogs } =
    useMaterialActions({
      id,
      title,
      learners,
      afterDelete: "/ruang-kerja/materi",
    });
  return (
    <>
      {status === "PUBLISHED" && (
        <Button variant="secondary" onClick={() => setDialog("archive")}>
          <ArchiveIcon aria-hidden="true" />
          Arsipkan
        </Button>
      )}
      {status === "ARCHIVED" && (
        <Button variant="secondary" disabled={pending} onClick={restore}>
          <ArchiveRestoreIcon aria-hidden="true" />
          Terbitkan kembali
        </Button>
      )}
      <Button variant="secondary" onClick={askDelete}>
        <Trash2Icon aria-hidden="true" />
        Hapus
      </Button>
      {dialogs}
    </>
  );
}

export { MaterialDetailActions, MaterialMenu };
