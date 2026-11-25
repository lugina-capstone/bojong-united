"use client";

import { Trash2Icon } from "lucide-react";
import * as React from "react";

import { DeleteAccountDialog } from "@/app/(auth)/dikeluarkan/delete-account-dialog";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton({ email }: { email: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        <Trash2Icon aria-hidden="true" />
        Hapus akun
      </Button>
      <DeleteAccountDialog email={email} open={open} onOpenChange={setOpen} />
    </>
  );
}
