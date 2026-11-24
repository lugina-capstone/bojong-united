"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/** Item menu aksi dengan ikon dan keterangan opsional. Nada Bahaya untuk aksi merusak. */
function MenuItem({
  icon: Icon,
  label,
  description,
  danger,
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof DropdownMenuItem>,
  "variant" | "children"
> & {
  icon?: LucideIcon;
  label: string;
  description?: string;
  danger?: boolean;
}) {
  return (
    <DropdownMenuItem
      variant={danger ? "destructive" : "default"}
      className={cn("items-start gap-2.5 rounded-md py-2.5", className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="mt-0.5 size-4" />}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-body-medium">{label}</span>
        {description && (
          <span className="text-caption text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </DropdownMenuItem>
  );
}

export { MenuItem };
