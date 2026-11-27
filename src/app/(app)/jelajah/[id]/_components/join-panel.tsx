"use client";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarClockIcon,
  PanelsTopLeftIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { joinEventAction } from "@/app/(app)/jelajah/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { initialsOf } from "@/components/ui/org-logo";
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
  dateRange,
  creatorName,
  milestoneCount,
  maxTeamMembers,
  userName,
  userEmail,
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
  dateRange: string;
  creatorName: string;
  milestoneCount: number;
  maxTeamMembers?: number;
  userName: string;
  userEmail: string;
  countLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const inviteLimit = Math.max(0, (maxTeamMembers ?? 1) - 1);

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
      <Badge tone={enrolled ? "success" : "neutral"} className="w-fit">
        {enrolled
          ? isTeam && !isLeader
            ? "Bergabung ke tim"
            : "Pendaftaran berhasil"
          : closedReason
            ? "Pendaftaran ditutup"
            : "Belum diikuti"}
      </Badge>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-h2 text-foreground">
          {enrolled
            ? "Siap mulai berkarya"
            : isTeam
              ? "Mulai perjalanan tim Anda"
              : "Mulai perjalanan Anda"}
        </h2>
        <p className="text-small text-muted-foreground">
          {enrolled
            ? isTeam
              ? isLeader
                ? `Anda terdaftar sebagai ketua ${teamName ?? "kelompok"}. Undang anggota sebelum acara dimulai.`
                : `Anda bergabung ke ${teamName ?? "kelompok"} sebagai anggota. Acara ini otomatis terdaftar di Beranda Anda.`
              : `Anda terdaftar sebagai ${userName}. Acara ini sudah ditambahkan ke Beranda Anda.`
            : (closedReason ??
              (isTeam
                ? `Acara tim. Saat mengikuti, Anda otomatis menjadi ketua Kelompok ${userName}${inviteLimit > 0 ? ` dan bisa mengundang hingga ${inviteLimit} anggota` : ""}.`
                : "Pendaftaran mandiri terbuka. Pelajari rincian, lalu ikuti acara dengan akun Anda."))}
        </p>
      </div>
      <dl className="flex flex-col gap-3 rounded-lg bg-muted p-4">
        <div>
          <dt className="text-overline text-muted-foreground uppercase">
            Mulai
          </dt>
          <dd className="text-small-strong text-foreground">{startsAt}</dd>
        </div>
        <div>
          <dt className="text-overline text-muted-foreground uppercase">
            Selesai
          </dt>
          <dd className="text-small-strong text-foreground">{endsAt}</dd>
        </div>
      </dl>
      <p className="text-small text-label">{countLabel}</p>
      {enrolled ? (
        <>
          <Link
            href={`/acara/${eventId}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
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
            size="lg"
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <IconBox icon={UserPlusIcon} tone="primary" size="lg" />
            <DialogTitle className="text-display">
              {isTeam ? "Ikuti acara tim ini?" : "Ikuti acara ini?"}
            </DialogTitle>
            <DialogDescription>
              {isTeam
                ? `Anda otomatis menjadi ketua Kelompok ${userName}.${inviteLimit > 0 ? ` Setelah mendaftar, undang hingga ${inviteLimit} anggota dengan mencari nama lengkap mereka.` : ""}`
                : "Anda akan mendaftar secara mandiri. Acara ini akan ditambahkan ke Beranda Anda setelah pendaftaran berhasil."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3 rounded-xl bg-background p-3.5">
            <IconBox icon={PanelsTopLeftIcon} tone="blue" size="md" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-h3 text-label">{title}</p>
              <p className="text-caption text-muted-foreground">
                {dateRange} · Guru: {creatorName}
              </p>
              <p className="text-caption text-muted-foreground">
                {milestoneCount} milestone ·{" "}
                {isTeam
                  ? `Acara tim, maks ${maxTeamMembers ?? 1} anggota`
                  : "Dikerjakan berurutan"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-overline text-subtle uppercase">
              {isTeam ? "Mendaftar sebagai ketua tim" : "Mendaftar sebagai"}
            </p>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{initialsOf(userName)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body-strong text-label">
                  {userName}
                </span>
                <span className="truncate text-caption text-muted-foreground">
                  {userEmail}
                </span>
              </div>
              <span className="shrink-0 text-caption text-subtle">
                {isTeam ? "Ketua" : "Peserta"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-primary-50 p-3.5">
            <CalendarClockIcon
              aria-hidden="true"
              className="mt-0.5 size-4.5 shrink-0 text-primary-500"
            />
            <div className="flex flex-col gap-1">
              <p className="text-body-strong text-tone-navy-fg">
                Milestone dibuka sesuai jadwal
              </p>
              <p className="text-small text-muted-foreground">
                Milestone pertama dibuka setelah Anda mendaftar dan waktu mulai
                acara tercapai: {startsAt}.
              </p>
              <p className="text-caption text-muted-foreground">
                Milestone berikutnya terbuka setelah tugas dan survei milestone
                sebelumnya selesai.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button size="lg" disabled={pending} onClick={join}>
              {isTeam ? "Ya, jadi ketua tim" : "Ya, ikuti acara"}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export { JoinPanel };
