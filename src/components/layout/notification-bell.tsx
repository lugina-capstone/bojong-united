"use client";

import { Popover } from "@base-ui/react/popover";
import {
  BellIcon,
  BookOpenIcon,
  Building2Icon,
  AwardIcon,
  CalendarIcon,
  FileTextIcon,
  UsersIcon,
  CircleCheckIcon,
  CircleXIcon,
  PowerIcon,
  RotateCwIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { IconBox } from "@/components/ui/icon-box";
import { formatRelative } from "@/lib/format";
import type {
  NotificationIcon,
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
};

/** Tombol lonceng + panel notifikasi (badge = jumlah belum dibaca). */
function NotificationBell({
  items,
  unread,
  onMarkRead,
}: {
  items: NotificationBellItem[];
  unread: number;
  onMarkRead: (ids?: string[]) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={
          unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"
        }
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-label outline-none hover:bg-muted focus-visible:shadow-focus-ring data-popup-open:bg-muted [&_svg]:size-5"
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
          <Popover.Popup className="flex max-h-[min(32rem,var(--available-height))] w-[min(26rem,calc(100vw-2rem))] origin-(--transform-origin) flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <Popover.Title className="text-body-strong text-foreground">
                Notifikasi
              </Popover.Title>
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
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-small text-muted-foreground">
                Belum ada notifikasi.
              </p>
            ) : (
              <ul className="flex-1 overflow-y-auto">
                {items.map((item) => {
                  const Icon = ICONS[item.icon];
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
                          "flex gap-3 px-4 py-3 outline-none hover:bg-muted focus-visible:bg-muted",
                          !item.read && "bg-primary-50/60",
                        )}
                      >
                        <IconBox icon={Icon} tone={item.tone} size="sm" />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-small-strong text-foreground">
                            {item.title}
                          </span>
                          {item.body && (
                            <span className="text-caption text-muted-foreground">
                              {item.body}
                            </span>
                          )}
                          <span className="text-caption-s text-subtle">
                            {formatRelative(new Date(item.createdAt))}
                          </span>
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
