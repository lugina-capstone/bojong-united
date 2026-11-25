"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { deleteAccountAction, type FormState } from "@/app/(auth)/actions";
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
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";
import { Input } from "@/components/ui/input";

function Consequence({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-2 text-small text-label">
      <Icon
        aria-hidden="true"
        className={`mt-0.5 size-4 shrink-0 ${className}`}
      />
      {children}
    </li>
  );
}

/** Konfirmasi hapus akun permanen (AA-10): ketik email + centang. */
function DeleteAccountDialog({
  email,
  organizationName,
  open,
  onOpenChange,
}: {
  email: string;
  /** Kosong untuk akun Peserta. */
  organizationName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [typed, setTyped] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [state, setState] = React.useState<FormState>({});
  const [pending, startTransition] = React.useTransition();
  const matches = typed.trim().toLowerCase() === email;
  const error = state.fieldErrors?.email ?? state.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () =>
              setState(
                (await deleteAccountAction({ email: typed, confirmed })) ?? {},
              ),
            );
          }}
        >
          <DialogHeader>
            <IconBox icon={Trash2Icon} tone="danger" size="md" />
            <DialogTitle>Hapus akun secara permanen?</DialogTitle>
            <DialogDescription>
              Akun {email} akan dihapus dari Becraft dan tidak dapat dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2">
            <Consequence icon={CircleCheckIcon} className="text-success-600">
              {organizationName
                ? `Acara dan penilaian yang Anda buat tetap tersimpan di ${organizationName}.`
                : 'Kiriman dan nilai Anda tetap tersimpan di acara atas nama "Akun dihapus".'}
            </Consequence>
            <Consequence icon={Trash2Icon} className="text-danger-500">
              Profil, portofolio pribadi, sertifikat, dan riwayat belajar ikut
              dihapus.
            </Consequence>
            <Consequence icon={InfoIcon} className="text-primary-500">
              Email ini dapat dipakai lagi untuk mendaftar akun baru.
            </Consequence>
          </ul>
          <FormField
            id="confirm-email"
            label="Ketik email akun untuk konfirmasi"
            description={`Ketik ${email} untuk melanjutkan.`}
            error={error}
          >
            <Input
              id="confirm-email"
              type="email"
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={fieldDescribedBy("confirm-email", {
                error,
                description: true,
              })}
            />
          </FormField>
          <label className="flex items-center gap-2.5 text-small text-label">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(value) => setConfirmed(value === true)}
            />
            Saya mengerti akun yang dihapus tidak dapat dipulihkan.
          </label>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!matches || !confirmed || pending}
            >
              <Trash2Icon aria-hidden="true" />
              Hapus akun
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { DeleteAccountDialog };
