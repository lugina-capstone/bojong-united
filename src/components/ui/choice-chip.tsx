"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

/** Grup chip pilihan (mis. Bidang). Pakai `multiple` untuk pilihan ganda. */
function ChoiceChipGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="choice-chip-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

function ChoiceChip({ className, children, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="choice-chip"
      className={cn(
        "group/chip inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3.5 py-2 text-small-medium text-label transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring disabled:pointer-events-none disabled:opacity-45 data-pressed:border-primary-500 data-pressed:bg-primary-50 data-pressed:text-small-strong data-pressed:text-primary-500 [&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <CheckIcon
        aria-hidden="true"
        className="hidden group-data-pressed/chip:block"
      />
      {children}
    </TogglePrimitive>
  );
}

export { ChoiceChipGroup, ChoiceChip };
