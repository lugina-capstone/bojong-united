"use client";

import { MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { respondInviteAction } from "@/app/(app)/jelajah/actions";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";

/** Undangan tim yang menunggu jawaban peserta. */
function InviteResponse({
  inviteId,
  inviterName,
  teamName,
  eventTitle,
}: {
  inviteId: string;
  inviterName: string;
  teamName: string;
  eventTitle?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function respond(accept: boolean) {
    startTransition(async () => {
      const result = await respondInviteAction(inviteId, accept);
      if (!result.ok)
        return void toast.error(result.error ?? "Gagal menjawab undangan.");
      if (accept) {
        toast.success(`Anda bergabung ke ${teamName}`, {
          description: eventTitle
            ? `${eventTitle} otomatis terdaftar di Beranda.`
            : "Acara otomatis terdaftar di Beranda.",
        });
      } else {
        toast.info("Undangan ditolak", {
          description: `${inviterName} akan menerima pemberitahuan.`,
        });
      }
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center">
      <IconBox icon={MailIcon} tone="primary" />
      <div className="min-w-0 flex-1">
        <p className="text-body-strong text-foreground">Undangan tim</p>
        <p className="text-small text-label">
          {inviterName} mengundang Anda ke {teamName}
          {eventTitle ? ` · ${eventTitle}` : ""}.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => respond(false)}
        >
          Tolak
        </Button>
        <Button size="sm" disabled={pending} onClick={() => respond(true)}>
          Terima
        </Button>
      </div>
    </section>
  );
}

export { InviteResponse };
