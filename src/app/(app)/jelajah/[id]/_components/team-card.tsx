"use client";

import { SearchIcon, UserMinusIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  cancelInviteAction,
  inviteTeamMemberAction,
  type InviteeResult,
  removeTeamMemberAction,
  searchInviteesAction,
} from "@/app/(app)/jelajah/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconBox } from "@/components/ui/icon-box";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRow } from "@/components/ui/user-row";

type Member = {
  enrollmentId: string;
  userId: string;
  name: string;
  email: string;
};
type Invite = {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "REJECTED";
};

/** Anggota tim di detail acara: ketua bisa mengundang, membatalkan, dan mengeluarkan sebelum acara dimulai. */
function TeamCard({
  teamId,
  teamName,
  leaderId,
  currentUserId,
  maxMembers,
  started,
  startLabel,
  members,
  invites,
}: {
  teamId: string;
  teamName: string;
  leaderId: string;
  currentUserId: string;
  maxMembers: number;
  started: boolean;
  startLabel: string;
  members: Member[];
  invites: Invite[];
}) {
  const router = useRouter();
  const isLeader = leaderId === currentUserId;
  const pendingCount = invites.filter((i) => i.status === "PENDING").length;
  const slots = maxMembers - members.length - pendingCount;
  const [pending, startTransition] = React.useTransition();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<Member | null>(null);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<InviteeResult[]>([]);

  React.useEffect(() => {
    if (!inviteOpen) return;
    const q = query.trim();
    const timer = setTimeout(async () => {
      setResults(q.length < 2 ? [] : await searchInviteesAction(teamId, q));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, inviteOpen, teamId]);

  function run(
    action: () => Promise<{ ok?: boolean; error?: string }>,
    done: { title: string; description?: string; tone?: "success" | "info" },
    after?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return void toast.error(result.error ?? "Gagal.");
      if (done.tone === "info") {
        toast.info(done.title, { description: done.description });
      } else {
        toast.success(done.title, { description: done.description });
      }
      after?.();
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-foreground">Anggota tim · {teamName}</h2>
        <p className="text-small text-muted-foreground">
          {members.length} dari {maxMembers} slot terisi.{" "}
          {!isLeader
            ? "Hanya ketua yang dapat menambah atau mengeluarkan anggota."
            : started
              ? "Acara sudah dimulai, susunan tim tidak bisa diubah."
              : `Anggota yang sudah bergabung bisa dikeluarkan sampai acara dimulai pada ${startLabel}.`}{" "}
          Setiap anggota mengumpulkan tugasnya sendiri.
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {members.map((member) => (
          <li key={member.userId} className="py-2.5">
            <UserRow
              name={member.name}
              detail={member.email}
              trailing={
                member.userId === leaderId ? (
                  <Badge tone="primary">
                    {member.userId === currentUserId ? "Ketua (Anda)" : "Ketua"}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge tone="success">
                      {member.userId === currentUserId
                        ? "Bergabung (Anda)"
                        : "Bergabung"}
                    </Badge>
                    {isLeader && !started && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRemoving(member)}
                      >
                        Keluarkan
                      </Button>
                    )}
                  </div>
                )
              }
            />
          </li>
        ))}
        {isLeader &&
          invites.map((invite) => (
            <li key={invite.id} className="py-2.5">
              <UserRow
                name={invite.name}
                detail={invite.email}
                trailing={
                  invite.status === "PENDING" ? (
                    <div className="flex items-center gap-2">
                      <Badge tone="warning">Menunggu</Badge>
                      {!started && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            run(() => cancelInviteAction(invite.id), {
                              tone: "info",
                              title: `Undangan untuk ${invite.name} dibatalkan`,
                              description: "Slot kelompok kembali tersedia.",
                            })
                          }
                        >
                          Batalkan undangan
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge tone="danger">Ditolak</Badge>
                  )
                }
              />
            </li>
          ))}
      </ul>
      {isLeader && !started && (
        <Button
          className="w-fit"
          disabled={slots <= 0}
          onClick={() => setInviteOpen(true)}
        >
          <UserPlusIcon aria-hidden="true" />
          {slots <= 0 ? "Slot tim penuh" : "Tambah anggota"}
        </Button>
      )}

      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) setQuery("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <IconBox icon={UserPlusIcon} tone="primary" />
            <DialogTitle>Tambah anggota tim</DialogTitle>
            <DialogDescription>
              Cari peserta yang sudah punya akun Becraft dengan nama lengkap.{" "}
              {teamName} masih punya {Math.max(slots, 0)} slot.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-search">Nama lengkap peserta</Label>
            <div className="relative">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              />
              <Input
                id="invite-search"
                value={query}
                autoComplete="off"
                placeholder="Ketik minimal 2 huruf"
                className="pl-9"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {query.trim().length >= 2 && results.length === 0 && (
              <li className="py-3 text-small text-muted-foreground">
                Tidak ada peserta dengan nama tersebut.
              </li>
            )}
            {results.map((result) => (
              <li key={result.id} className="py-1.5">
                <UserRow
                  name={result.name}
                  detail={result.email}
                  trailing={
                    result.state === "available" ? (
                      <Button
                        size="sm"
                        disabled={pending || slots <= 0}
                        onClick={() =>
                          run(
                            () => inviteTeamMemberAction(teamId, result.id),
                            {
                              title: `Undangan terkirim ke ${result.name}`,
                              description: `Statusnya Menunggu sampai ${result.name.split(" ")[0] ?? result.name} menerima atau menolak.`,
                            },
                            () =>
                              setResults((list) =>
                                list.map((r) =>
                                  r.id === result.id
                                    ? { ...r, state: "invited" }
                                    : r,
                                ),
                              ),
                          )
                        }
                      >
                        Undang
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled>
                        {result.state === "invited"
                          ? "Sudah diundang"
                          : "Sudah di tim lain"}
                      </Button>
                    )
                  }
                />
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <DialogContent>
          <DialogHeader>
            <IconBox icon={UserMinusIcon} tone="danger" />
            <DialogTitle>Keluarkan {removing?.name}?</DialogTitle>
            <DialogDescription>
              {removing?.name} tidak lagi terdaftar di acara ini dan menerima
              notifikasi. Slot tim bisa diisi peserta lain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                removing &&
                run(
                  () => removeTeamMemberAction(removing.enrollmentId),
                  {
                    title: `${removing.name} dikeluarkan dari kelompok`,
                    description: `${removing.name.split(" ")[0] ?? removing.name} tidak lagi terdaftar di acara ini.`,
                  },
                  () => setRemoving(null),
                )
              }
            >
              Keluarkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export { TeamCard };
