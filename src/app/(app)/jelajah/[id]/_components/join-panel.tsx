"use client";

import { ArrowRightIcon, ArrowUpRightIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { joinEventAction } from "@/app/(app)/jelajah/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconBox } from "@/components/ui/icon-box";
import { cn } from "@/lib/utils";

/** Kartu "Mulai perjalanan Anda": ikuti acara, atau buka ruang kerja setelah terdaftar. */
function JoinPanel({
  eventId,
  title,
  isTeam,
  teamName,
  isLeader,
  enrolled,
  closedReason,
  startsAt,
  endsAt,
  countLabel,
}: {
  eventId: string;
  title: string;
  isTeam: boolean;
  teamName?: string;
  isLeader: boolean;
  enrolled: boolean;
  closedReason: string | null;
  startsAt: string;
  endsAt: string;
  countLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function join() {
    startTransition(async () => {
      const result = await joinEventAction(eventId);
      if (!result.ok)
        return void toast.error(result.error ?? "Gagal mengikuti acara.");
      setOpen(false);
      toast.success("Pendaftaran berhasil.");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <Badge
        tone={enrolled ? "success" : closedReason ? "neutral" : "neutral"}
        className="w-fit"
      >
        {enrolled
          ? "Pendaftaran berhasil"
          : closedReason
            ? "Pendaftaran ditutup"
            : "Belum diikuti"}
      </Badge>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-h2 text-foreground">
          {enrolled ? "Siap mulai berkarya" : "Mulai perjalanan Anda"}
        </h2>
        <p className="text-small text-muted-foreground">
          {enrolled
            ? isTeam
              ? `Anda terdaftar ${isLeader ? "sebagai ketua" : "sebagai anggota"} ${teamName ?? "kelompok"}.${isLeader ? " Undang anggota sebelum acara dimulai." : ""}`
              : "Acara ini sudah ditambahkan ke Beranda Anda."
            : (closedReason ??
              (isTeam
                ? "Mendaftar sendiri menjadikan Anda ketua kelompok baru. Anda bisa mengundang anggota sebelum acara dimulai."
                : "Pendaftaran mandiri terbuka. Pelajari rincian, lalu ikuti acara dengan akun Anda."))}
        </p>
      </div>
      <dl className="flex flex-col gap-3 rounded-lg bg-muted p-4">
        <div>
          <dt className="text-overline text-muted-foreground">Mulai</dt>
          <dd className="text-small-strong text-foreground">{startsAt}</dd>
        </div>
        <div>
          <dt className="text-overline text-muted-foreground">Selesai</dt>
          <dd className="text-small-strong text-foreground">{endsAt}</dd>
        </div>
      </dl>
      <p className="text-small text-label">{countLabel}</p>
      {enrolled ? (
        <>
          <Link
            href={`/acara/${eventId}`}
            className={cn(buttonVariants(), "w-full")}
          >
            Buka ruang kerja
            <ArrowRightIcon aria-hidden="true" />
          </Link>
          <p className="text-caption text-muted-foreground">
            Milestone pertama terbuka sesuai tanggal mulai acara. Lanjutkan
            pengerjaan melalui ruang kerja.
          </p>
          <Link
            href="/beranda"
            className="inline-flex items-center justify-center gap-1 text-small-strong text-primary-500 hover:underline"
          >
            Lihat di beranda
            <ArrowUpRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </>
      ) : (
        <>
          <Button
            className="w-full"
            disabled={Boolean(closedReason)}
            onClick={() => setOpen(true)}
          >
            {isTeam ? "Ikuti sebagai ketua tim" : "Ikuti acara"}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
          <p className="text-caption text-muted-foreground">
            Rincian acara dapat diakses sebelum mendaftar. Milestone pertama
            dibuka setelah mengikuti acara dan jadwal mulai tercapai.
          </p>
        </>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <IconBox icon={UsersIcon} tone="primary" />
            <DialogTitle>Ikuti {title}?</DialogTitle>
            <DialogDescription>
              {isTeam
                ? "Anda akan menjadi ketua kelompok baru. Setiap anggota tetap mengumpulkan tugas dan menerima nilai masing-masing."
                : "Acara akan tampil di Beranda dan Anda bisa mulai mengerjakan milestone saat acara dimulai."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending} onClick={join}>
              Ya, ikuti acara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export { JoinPanel };
