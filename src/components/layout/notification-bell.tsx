"use client";

import { Popover } from "@base-ui/react/popover";
import {
  ArrowRightIcon,
  AwardIcon,
  BellIcon,
  BookOpenIcon,
  Building2Icon,
  CalendarIcon,
  CircleCheckIcon,
  CircleXIcon,
  FileTextIcon,
  PowerIcon,
  RotateCwIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { formatDateTime, formatRelative } from "@/lib/format";
import type {
  NotificationIcon,
  NotificationTeamInvite,
  NotificationView,
} from "@/lib/notification-format";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationIcon, LucideIcon> = {
  building: Building2Icon,
  refresh: RotateCwIcon,
  check: CircleCheckIcon,
  x: CircleXIcon,
  "user-plus": UserPlusIcon,
  shield: ShieldCheckIcon,
  book: BookOpenIcon,
  power: PowerIcon,
  calendar: CalendarIcon,
  file: FileTextIcon,
  award: AwardIcon,
  users: UsersIcon,
};

export type NotificationBellItem = NotificationView & {
  id: string;
  createdAt: string;
  read: boolean;
  teamInvite?: NotificationTeamInvite;
};

/** Tombol lonceng + panel notifikasi (badge = jumlah belum dibaca). */
function NotificationBell({
  items,
  unread,
  onMarkRead,
  onRespondInvite,
}: {
  items: NotificationBellItem[];
  unread: number;
  onMarkRead: (ids?: string[]) => Promise<void>;
  onRespondInvite?: (
    inviteId: string,
    accept: boolean,
  ) => Promise<{ ok?: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [pending, startTransition] = React.useTransition();
  const [actingInvite, setActingInvite] = React.useState<{
    id: string;
    accept: boolean;
  } | null>(null);
  const [resolvedInviteIds, setResolvedInviteIds] = React.useState<string[]>(
    [],
  );
  const visibleItems =
    filter === "unread" ? items.filter((item) => !item.read) : items;

  function handleInviteResponse(item: NotificationBellItem, accept: boolean) {
    if (!item.teamInvite || !onRespondInvite) return;
    const invite = item.teamInvite;
    setActingInvite({ id: invite.inviteId, accept });
    startTransition(async () => {
      try {
        const result = await onRespondInvite(invite.inviteId, accept);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setResolvedInviteIds((prev) => [...prev, invite.inviteId]);
        if (!item.read && !item.id.startsWith("invite:")) {
          await onMarkRead([item.id]);
        }
        setOpen(false);
        if (accept) {
          toast.success(`Anda bergabung ke ${invite.teamName}`, {
            description: `${invite.eventTitle} otomatis terdaftar di Beranda.`,
          });
          router.push(`/jelajah/${invite.eventId}`);
        } else {
          toast.info("Undangan ditolak", {
            description: `${invite.inviterName} akan menerima pemberitahuan.`,
          });
          router.refresh();
        }
      } finally {
        setActingInvite(null);
      }
    });
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={
          unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"
        }
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-label outline-none hover:bg-muted focus-visible:shadow-focus-ring data-popup-open:bg-muted [&_svg]:size-4.5"
      >
        <BellIcon aria-hidden="true" />
        {unread > 0 && (
          <span className="pointer-events-none absolute -top-1 -right-1 flex min-w-4.5 items-center justify-center rounded-full bg-danger-500 px-1 text-caption-strong text-inverse">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup className="flex max-h-[min(34rem,var(--available-height))] w-[min(27rem,calc(100vw-2rem))] origin-(--transform-origin) flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Popover.Title className="text-h2 text-foreground">
                    Notifikasi
                  </Popover.Title>
                  {unread > 0 && (
                    <Badge tone="primary" size="sm">
                      {unread} baru
                    </Badge>
                  )}
                </div>
                <Popover.Close
                  aria-label="Tutup notifikasi"
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:shadow-focus-ring"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </Popover.Close>
              </div>
              {items.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={filter === "all" ? "primary" : "secondary"}
                      onClick={() => setFilter("all")}
                    >
                      Semua
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={filter === "unread" ? "primary" : "secondary"}
                      onClick={() => setFilter("unread")}
                    >
                      Belum dibaca ({unread})
                    </Button>
                  </div>
                  {unread > 0 && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startTransition(() => onMarkRead())}
                      className="rounded-sm text-small-strong text-primary-500 outline-none hover:underline focus-visible:shadow-focus-ring disabled:opacity-45"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
              )}
            </div>
            {visibleItems.length === 0 ? (
              <p className="px-4 py-10 text-center text-small text-muted-foreground">
                {filter === "unread" && items.length > 0
                  ? "Semua notifikasi sudah dibaca."
                  : "Belum ada notifikasi."}
              </p>
            ) : (
              <ul className="flex-1 overflow-y-auto">
                {visibleItems.map((item) => {
                  const Icon = ICONS[item.icon];
                  const invite =
                    item.teamInvite &&
                    onRespondInvite &&
                    !resolvedInviteIds.includes(item.teamInvite.inviteId)
                      ? item.teamInvite
                      : null;

                  if (invite) {
                    const isActingThis = actingInvite?.id === invite.inviteId;
                    return (
                      <li
                        key={item.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <div
                          className={cn(
                            "flex gap-3.5 px-4 py-3.5",
                            !item.read && "bg-primary-50/70",
                          )}
                        >
                          <IconBox icon={Icon} tone="sand" size="sm" />
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-0.5">
                              <Link
                                href={item.href}
                                onClick={() => {
                                  setOpen(false);
                                  if (
                                    !item.read &&
                                    !item.id.startsWith("invite:")
                                  )
                                    startTransition(() =>
                                      onMarkRead([item.id]),
                                    );
                                }}
                                className="text-h3 text-foreground outline-none hover:text-primary-600 focus-visible:underline"
                              >
                                {item.title}
                              </Link>
                              <Link
                                href={item.href}
                                onClick={() => {
                                  setOpen(false);
                                  if (
                                    !item.read &&
                                    !item.id.startsWith("invite:")
                                  )
                                    startTransition(() =>
                                      onMarkRead([item.id]),
                                    );
                                }}
                                className="text-small-strong text-label outline-none hover:text-primary-600 focus-visible:underline"
                              >
                                {invite.eventTitle}
                              </Link>
                            </div>
                            <p className="text-small text-muted-foreground">
                              {invite.inviterName} mengundang Anda ke{" "}
                              {invite.teamName} ({invite.memberCount} dari{" "}
                              {invite.maxTeamMembers} slot terisi). Jika
                              diterima, acara ini otomatis terdaftar di Beranda
                              Anda.
                            </p>
                            {invite.startsAt && (
                              <p className="text-small-strong text-warning-700">
                                Acara dimulai:{" "}
                                {formatDateTime(new Date(invite.startsAt))} WIB
                              </p>
                            )}
                            <p className="text-small text-muted-foreground">
                              Pengumpulan tugas dan nilai tetap per anggota.
                            </p>
                            <span className="text-caption text-subtle">
                              {formatDateTime(new Date(item.createdAt))} WIB
                            </span>
                            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                              <Button
                                type="button"
                                size="sm"
                                className="min-w-24 px-5"
                                disabled={pending || isActingThis}
                                onClick={() => handleInviteResponse(item, true)}
                              >
                                {isActingThis && actingInvite.accept
                                  ? "Memproses…"
                                  : "Terima"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={pending || isActingThis}
                                onClick={() =>
                                  handleInviteResponse(item, false)
                                }
                              >
                                {isActingThis && !actingInvite.accept
                                  ? "Memproses…"
                                  : "Tolak"}
                              </Button>
                            </div>
                          </div>
                          {!item.read && (
                            <span
                              aria-label="Belum dibaca"
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-500"
                            />
                          )}
                        </div>
                      </li>
                    );
                  }

                  const isActionButton =
                    !item.read && item.tone === "warning" && item.actionLabel;
                  return (
                    <li
                      key={item.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          setOpen(false);
                          if (!item.read)
                            startTransition(() => onMarkRead([item.id]));
                        }}
                        className={cn(
                          "flex gap-3.5 px-4 py-3.5 outline-none hover:bg-muted focus-visible:bg-muted",
                          !item.read && "bg-primary-50/70",
                        )}
                      >
                        <IconBox icon={Icon} tone={item.tone} size="sm" />
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-h3 text-foreground">
                            {item.title}
                          </span>
                          {item.body && (
                            <span className="text-small text-muted-foreground">
                              {item.body}
                            </span>
                          )}
                          <span className="text-caption text-subtle">
                            {formatRelative(new Date(item.createdAt))}
                          </span>
                          {item.actionLabel &&
                            (isActionButton ? (
                              <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-button-s text-inverse">
                                {item.actionLabel}
                                <ArrowRightIcon
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-small-strong text-primary-500">
                                {item.actionLabel} →
                              </span>
                            ))}
                        </span>
                        {!item.read && (
                          <span
                            aria-label="Belum dibaca"
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-500"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { NotificationBell };
