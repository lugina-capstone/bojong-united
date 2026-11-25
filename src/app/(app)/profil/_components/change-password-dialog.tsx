"use client";

import { KeyRoundIcon, LockKeyholeIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/app/(auth)/_components/password-input";
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
import { FormField, fieldDescribedBy } from "@/components/ui/form-field";

import { changePasswordAction, type ProfileFormState } from "../actions";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

const FIELDS = [
  {
    key: "currentPassword",
    label: "Kata sandi saat ini",
    autoComplete: "current-password",
  },
  {
    key: "newPassword",
    label: "Kata sandi baru",
    autoComplete: "new-password",
    description: "Minimal 8 karakter.",
  },
  {
    key: "confirmPassword",
    label: "Ulangi kata sandi baru",
    autoComplete: "new-password",
  },
] as const;

/** Tombol + dialog "Ubah kata sandi" untuk akun yang terdaftar manual. */
export function ChangePasswordDialog({
  placement,
}: {
  /** `header`: tombol di kepala halaman; `card`: tombol selebar kartu Keamanan. */
  placement: "header" | "card";
}) {
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState(EMPTY);
  const [state, setState] = React.useState<ProfileFormState>({});
  const [pending, startTransition] = React.useTransition();
  const errors = state.fieldErrors ?? {};
  const Icon = placement === "header" ? KeyRoundIcon : LockKeyholeIcon;
  const idPrefix = `ubah-sandi-${placement}`;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setValues(EMPTY);
      setState({});
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        className={placement === "card" ? "w-full" : undefined}
        onClick={() => setOpen(true)}
      >
        <Icon aria-hidden="true" />
        Ubah kata sandi
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await changePasswordAction(values);
                if (result.ok) {
                  toast.success("Kata sandi berhasil diubah.");
                  onOpenChange(false);
                } else setState(result);
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Ubah kata sandi</DialogTitle>
              <DialogDescription>
                Setelah diubah, sesi di perangkat lain akan dikeluarkan.
              </DialogDescription>
            </DialogHeader>
            {state.error && <Alert tone="danger" title={state.error} />}
            {FIELDS.map((field) => {
              const id = `${idPrefix}-${field.key}`;
              const error = errors[field.key];
              const description =
                "description" in field ? field.description : undefined;
              return (
                <FormField
                  key={field.key}
                  id={id}
                  label={field.label}
                  description={description}
                  error={error}
                >
                  <PasswordInput
                    id={id}
                    autoComplete={field.autoComplete}
                    value={values[field.key]}
                    onChange={(event) =>
                      setValues({ ...values, [field.key]: event.target.value })
                    }
                    aria-invalid={Boolean(error)}
                    aria-describedby={fieldDescribedBy(id, {
                      error,
                      description,
                    })}
                  />
                </FormField>
              );
            })}
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" loading={pending}>
                Simpan kata sandi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
