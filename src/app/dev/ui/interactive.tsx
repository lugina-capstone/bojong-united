"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OtpInput } from "@/components/ui/otp-input";
import { RubricScoreRow } from "@/components/ui/rubric";

function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() => toast.success("Perubahan disimpan")}
      >
        Toast sukses
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.error("Gagal mengunggah berkas")}
      >
        Toast gagal
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.info("Kode organisasi disalin")}
      >
        Toast info
      </Button>
    </div>
  );
}

function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="danger" />}>
        Keluarkan anggota
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keluarkan Aisyah Putri?</DialogTitle>
          <DialogDescription>
            Acara yang dibuat anggota ini dialihkan ke admin organisasi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="danger">Keluarkan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OtpDemo() {
  const [value, setValue] = React.useState("4829");
  return (
    <div className="flex flex-col gap-3">
      <OtpInput
        value={value}
        onChange={setValue}
        aria-label="Kode verifikasi"
      />
      <OtpInput value="123456" invalid readOnly aria-label="Kode salah" />
    </div>
  );
}

function RubricDemo() {
  const [score, setScore] = React.useState<number | null>(3);
  return (
    <RubricScoreRow name="Konsistensi" value={score} onValueChange={setScore} />
  );
}

export { ToastDemo, DialogDemo, OtpDemo, RubricDemo };
