"use client";

import {
  BookOpenIcon,
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClipboardCheckIcon,
  EllipsisIcon,
  GraduationCapIcon,
  MailIcon,
  ShieldCheckIcon,
  ShieldMinusIcon,
  UserCogIcon,
  UserMinusIcon,
  UserRoundIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ConsequenceList } from "@/app/(app)/_components/info-rows";
import {
  changeMemberRoleAction,
  removeMemberAction,
  setMemberAdminAction,
} from "@/app/(app)/organisasi/actions";
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
import type { MemberRole } from "@/generated/prisma/enums";
import { LAST_ADMIN_REASON } from "@/lib/organization-rules";

const ROLE_OPTIONS: {
  value: MemberRole;
  label: string;
  icon: typeof GraduationCapIcon;
  description: string;
}[] = [
  {
    value: "GURU",
    label: "Guru",
    icon: GraduationCapIcon,
    description: "Membuat acara, memantau progres, dan menilai peserta.",
  },
  {
    value: "ASESOR",
    label: "Asesor",
    icon: ClipboardCheckIcon,
    description:
      "Hak akses sama dengan Guru: membuat, memantau, dan menilai acara.",
  },
  {
    value: "TRAINER",
    label: "Trainer",
    icon: BookOpenIcon,
    description:
      "Semua fitur Guru/Asesor + unggah materi pembelajaran tanpa milestone.",
  },
];

export type MemberSummary = {
  id: string;
  name: string;
  role: MemberRole;
  isAdmin: boolean;
  isSelf: boolean;
  eventCount: number;
  materialCount: number;
};

type DialogKind = "role" | "admin" | "remove" | null;

/** Menu aksi per anggota + dialog Ubah peran, Jadikan/Turunkan admin, dan Keluarkan. */
function MemberActions({
  member,
  adminCount,
  organizationName,
  variant = "menu",
}: {
  member: MemberSummary;
  adminCount: number;
  organizationName: string;
  variant?: "menu" | "buttons";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  const [role, setRole] = React.useState<MemberRole>(member.role);
  const [pending, startTransition] = React.useTransition();
  const firstName = member.name.split(" ")[0];
  const lastAdmin = member.isAdmin && adminCount <= 1;
  const removeBlocked = member.isSelf
    ? "Gunakan Keluar dari organisasi untuk akun Anda sendiri."
    : member.isAdmin
      ? "Turunkan jadi anggota terlebih dahulu."
      : null;

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

  function openProfile() {
    const query = new URLSearchParams(searchParams.toString());
    query.set("profil", member.id);
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  }

  return (
    <>
      {variant === "menu" ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Aksi untuk ${member.name}`}
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <EllipsisIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <MenuItem
              icon={UserRoundIcon}
              label="Lihat profil anggota"
              onClick={openProfile}
            />
            <MenuItem
              icon={UserCogIcon}
              label="Ubah peran"
              description="Guru, Asesor, atau Trainer."
              onClick={() => {
                setRole(member.role);
                setDialog("role");
              }}
            />
            {member.isAdmin ? (
              <MenuItem
                icon={ShieldMinusIcon}
                label="Turunkan jadi anggota"
                description={
                  lastAdmin
                    ? LAST_ADMIN_REASON
                    : `${firstName} menjadi anggota biasa.`
                }
                disabled={lastAdmin}
                onClick={() => setDialog("admin")}
              />
            ) : (
              <MenuItem
                icon={ShieldCheckIcon}
                label="Jadikan admin"
                description={`${firstName} dapat mengelola organisasi.`}
                onClick={() => setDialog("admin")}
              />
            )}
            <DropdownMenuSeparator />
            <MenuItem
              icon={UserMinusIcon}
              label="Keluarkan dari organisasi"
              description={removeBlocked ?? undefined}
              danger
              disabled={Boolean(removeBlocked)}
              onClick={() => setDialog("remove")}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={lastAdmin}
            title={lastAdmin ? LAST_ADMIN_REASON : undefined}
            onClick={() => setDialog("admin")}
          >
            {member.isAdmin ? (
              <ShieldMinusIcon aria-hidden="true" />
            ) : (
              <ShieldCheckIcon aria-hidden="true" />
            )}
            {member.isAdmin ? "Turunkan admin" : "Jadikan admin"}
          </Button>
          <Button
            variant="secondary"
            className="text-danger-500"
            disabled={Boolean(removeBlocked)}
            title={removeBlocked ?? undefined}
            onClick={() => setDialog("remove")}
          >
            <UserMinusIcon aria-hidden="true" />
            Keluarkan
          </Button>
        </div>
      )}

      <Dialog
        open={dialog === "role"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox icon={UserCogIcon} tone="neutral" size="md" />
            <DialogTitle>Ubah peran {member.name}</DialogTitle>
            <DialogDescription>
              Peran menentukan fitur yang tersedia di ruang kerja anggota.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Peran</legend>
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-input bg-card p-3 transition-colors hover:bg-muted has-checked:border-primary-500 has-checked:bg-primary-50 has-focus-visible:shadow-focus-ring"
              >
                <input
                  type="radio"
                  name="member-role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="peer sr-only"
                />
                <option.icon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary-500"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body-strong text-foreground">
                    {option.label}
                  </span>
                  <span className="text-small text-muted-foreground">
                    {option.description}
                  </span>
                </span>
                <CircleCheckIcon
                  aria-hidden="true"
                  className="hidden size-5 shrink-0 text-primary-500 peer-checked:block"
                />
              </label>
            ))}
          </fieldset>
          <p className="text-small text-muted-foreground">
            Status admin diatur terpisah lewat &ldquo;Jadikan admin&rdquo;.
            Anggota menerima notifikasi setelah perannya diubah.
          </p>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(
                  () => changeMemberRoleAction(member.id, role),
                  `Peran ${member.name} diperbarui.`,
                )
              }
            >
              <CheckIcon aria-hidden="true" />
              Simpan peran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "admin"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox
              icon={member.isAdmin ? ShieldMinusIcon : ShieldCheckIcon}
              tone={member.isAdmin ? "warning" : "primary"}
              size="md"
            />
            <DialogTitle>
              {member.isAdmin
                ? `Turunkan ${member.name} jadi anggota?`
                : `Jadikan ${member.name} admin?`}
            </DialogTitle>
            <DialogDescription>
              {member.isAdmin
                ? `${firstName} tidak lagi dapat mengelola profil, kode, dan anggota ${organizationName}.`
                : `${firstName} dapat mengelola profil, kode, anggota, dan pengajuan Trainer ${organizationName}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(
                  () => setMemberAdminAction(member.id, !member.isAdmin),
                  member.isAdmin
                    ? `${member.name} kini anggota biasa.`
                    : `${member.name} kini admin.`,
                )
              }
            >
              {member.isAdmin ? "Turunkan" : "Jadikan admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "remove"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <IconBox icon={UserMinusIcon} tone="danger" size="md" />
            <DialogTitle>Keluarkan {member.name} dari organisasi?</DialogTitle>
            <DialogDescription>
              {firstName} tidak lagi menjadi anggota {organizationName} dan
              tidak bisa mengakses ruang kerja organisasi.
            </DialogDescription>
          </DialogHeader>
          <ConsequenceList
            items={[
              {
                icon: CircleXIcon,
                tone: "danger",
                text: "Akses ke acara, penilaian, dan data peserta organisasi dicabut.",
              },
              {
                icon: CircleCheckIcon,
                tone: "success",
                text: `${member.eventCount} acara yang dibuat ${firstName} tetap milik organisasi dan dialihkan ke Anda.`,
              },
              ...(member.materialCount > 0
                ? [
                    {
                      icon: CircleCheckIcon,
                      tone: "success" as const,
                      text: `${member.materialCount} materi milik ${firstName} dialihkan ke Trainer aktif lain di organisasi. Jika tidak ada, materi yang terbit diarsipkan.`,
                    },
                  ]
                : []),
              {
                icon: CircleCheckIcon,
                tone: "success",
                text: `Akun ${firstName} tetap ada. Saat masuk, ${firstName} dapat membuat organisasi, bergabung ke organisasi lain, atau masuk sebagai peserta.`,
              },
              {
                icon: MailIcon,
                tone: "info",
                text: `${firstName} menerima pemberitahuan melalui email.`,
              },
            ]}
          />
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                run(
                  () => removeMemberAction(member.id),
                  `${member.name} dikeluarkan dari organisasi.`,
                )
              }
            >
              <UserMinusIcon aria-hidden="true" />
              Keluarkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { MemberActions };
