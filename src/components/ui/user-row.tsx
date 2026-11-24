import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/components/ui/org-logo";

/** Baris identitas pengguna (Avatar + nama + email/peran) di tabel dan daftar. */
function UserRow({
  name,
  detail,
  trailing,
  className,
}: {
  name: string;
  detail?: string;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="user-row"
      className={cn("flex min-w-0 items-center gap-2.5", className)}
    >
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body-strong text-foreground">{name}</p>
        {detail && (
          <p className="truncate text-small text-muted-foreground">{detail}</p>
        )}
      </div>
      {trailing && (
        <div className="shrink-0 text-small-strong text-label">{trailing}</div>
      )}
    </div>
  );
}

export { UserRow };
