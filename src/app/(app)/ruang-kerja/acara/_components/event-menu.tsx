"use client";

import {
  ArchiveIcon,
  BellIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  EllipsisIcon,
  EyeIcon,
  LockIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ConsequenceList } from "@/app/(app)/_components/info-rows";
import {
  archiveEventAction,
  closeEventAction,
  deleteEventAction,
} from "@/app/(app)/ruang-kerja/acara/actions";
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
import type { EventStatus } from "@/generated/prisma/enums";

type Kind = "edit" | "close" | "archive" | "delete" | null;

export type EventMenuProps = {
  id: string;
  title: string;
  status: EventStatus;
  participantCount: number;
  draftStep: number;
};

/** Menu kelola acara di Acara Saya + dialog konfirmasi. */
function EventMenu({
  id,
  title,
  status,
  participantCount,
  draftStep,
}: EventMenuProps) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<Kind>(null);
  const [pending, startTransition] = React.useTransition();
  const isDraft = status === "DRAFT";
  const deleteBlocked = !isDraft && participantCount > 0;

  function run(
    action: () => Promise<{ ok?: boolean; error?: string }>,
    message: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error) return void toast.error(result.error);
      toast.success(message);
      setDialog(null);
    });
  }

  const dialogs = {
    edit: {
      icon: PencilIcon,
      tone: "warning",
      title: "Edit acara yang sedang berjalan?",
      description: `${title} sudah diikuti ${participantCount} peserta. Perubahan akan langsung terlihat oleh peserta.`,
      items: [
        {
          icon: CircleCheckIcon,
          tone: "success",
          text: "Bisa diubah: judul, deskripsi, arahan, tanggal selesai, dan tenggat milestone yang belum dikumpulkan.",
        },
        {
          icon: LockIcon,
          tone: "warning",
          text: "Terkunci: milestone yang sudah dikumpulkan, rubrik, jenis peserta, dan KKM.",
        },
        {
          icon: BellIcon,
          tone: "info",
          text: "Peserta menerima notifikasi jika tenggat berubah.",
        },
      ],
      confirm: "Lanjut edit",
      danger: false,
      onConfirm: () => {
        setDialog(null);
        router.push(`/ruang-kerja/acara/${id}/ubah`);
      },
    },
    close: {
      icon: LockIcon,
      tone: "warning",
      title: "Tutup acara lebih awal?",
      description: `${title} akan berakhir sekarang.`,
      items: [
        {
          icon: LockIcon,
          tone: "warning",
          text: "Peserta tidak bisa mengumpulkan atau merevisi karya lagi.",
        },
        {
          icon: CircleCheckIcon,
          tone: "success",
          text: "Anda tetap bisa menilai karya yang sudah masuk.",
        },
      ],
      confirm: "Tutup acara",
      danger: true,
      onConfirm: () =>
        run(() => closeEventAction(id), "Acara ditutup lebih awal."),
    },
    archive: {
      icon: ArchiveIcon,
      tone: "neutral",
      title: "Arsipkan acara?",
      description: `${title} disembunyikan dari Jelajah dan daftar acara aktif.`,
      items: [
        {
          icon: CircleCheckIcon,
          tone: "success",
          text: "Nilai, sertifikat, dan karya peserta tetap tersimpan.",
        },
        {
          icon: LockIcon,
          tone: "warning",
          text: "Acara yang diarsipkan menjadi hanya-baca.",
        },
      ],
      confirm: "Arsipkan",
      danger: false,
      onConfirm: () => run(() => archiveEventAction(id), "Acara diarsipkan."),
    },
    delete: {
      icon: Trash2Icon,
      tone: "danger",
      title: isDraft ? "Hapus draf acara?" : "Hapus acara?",
      description: `${title} akan dihapus permanen beserta milestone dan pengaturannya.`,
      items: [
        {
          icon: Trash2Icon,
          tone: "danger",
          text: "Tindakan ini tidak dapat dibatalkan.",
        },
      ],
      confirm: "Hapus",
      danger: true,
      onConfirm: () =>
        run(
          () => deleteEventAction(id),
          isDraft ? "Draf dihapus." : "Acara dihapus.",
        ),
    },
  } as const;
  const active = dialog ? dialogs[dialog] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Kelola ${title}`}
          render={<Button variant="secondary" size="icon-sm" />}
        >
          <EllipsisIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {isDraft ? (
            <MenuItem
              icon={PlayIcon}
              label="Lanjutkan draf"
              description={`Langkah ${draftStep} dari 5`}
              onClick={() =>
                router.push(`/ruang-kerja/acara/${id}/edit?step=${draftStep}`)
              }
            />
          ) : (
            <>
              {status === "PUBLISHED" && (
                <>
                  <MenuItem
                    icon={PencilIcon}
                    label="Edit acara"
                    description="Hanya bagian yang belum berjalan"
                    onClick={() => setDialog("edit")}
                  />
                  <MenuItem
                    icon={CalendarClockIcon}
                    label="Perpanjang tenggat milestone"
                    onClick={() =>
                      router.push(`/ruang-kerja/acara/${id}/ubah#milestone`)
                    }
                  />
                </>
              )}
              <MenuItem
                icon={status === "ARCHIVED" ? EyeIcon : UsersIcon}
                label={
                  status === "ARCHIVED" ? "Lihat rincian" : "Lihat peserta"
                }
                onClick={() => router.push(`/ruang-kerja/acara/${id}`)}
              />
              {status !== "ARCHIVED" && <DropdownMenuSeparator />}
              {status === "PUBLISHED" && (
                <MenuItem
                  icon={LockIcon}
                  label="Tutup acara lebih awal"
                  onClick={() => setDialog("close")}
                />
              )}
              {status !== "ARCHIVED" && (
                <MenuItem
                  icon={ArchiveIcon}
                  label="Arsipkan acara"
                  description="Sembunyikan dari Jelajah"
                  onClick={() => setDialog("archive")}
                />
              )}
            </>
          )}
          <MenuItem
            icon={Trash2Icon}
            label={isDraft ? "Hapus draf" : "Hapus acara"}
            description={
              deleteBlocked ? "Tidak bisa: sudah ada peserta" : undefined
            }
            danger
            disabled={deleteBlocked}
            onClick={() => setDialog("delete")}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        {active && (
          <DialogContent showCloseButton={false} className="sm:max-w-md">
            <DialogHeader>
              <IconBox icon={active.icon} tone={active.tone} size="md" />
              <DialogTitle>{active.title}</DialogTitle>
              <DialogDescription>{active.description}</DialogDescription>
            </DialogHeader>
            <ConsequenceList items={[...active.items]} />
            <DialogFooter className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Batal
              </Button>
              <Button
                variant={active.danger ? "danger" : "primary"}
                disabled={pending}
                onClick={active.onConfirm}
              >
                <active.icon aria-hidden="true" />
                {active.confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

export { EventMenu };
