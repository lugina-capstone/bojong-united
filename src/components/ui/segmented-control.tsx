"use client";

import * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";

/** Segmen pilihan tunggal, mis. filter Semua/Aktif/Selesai. */
function SegmentedControl({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: ToggleGroupPrimitive.Props) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? []);
  return (
    <ToggleGroupPrimitive
      data-slot="segmented-control"
      value={value ?? uncontrolled}
      onValueChange={(next, details) => {
        if (next.length === 0) return;
        setUncontrolled(next);
        onValueChange?.(next, details);
      }}
      className={cn(
        "inline-flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.5",
        className,
      )}
      {...props}
    />
  );
}

function SegmentedControlItem({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="segmented-control-item"
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-small-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-card focus-visible:shadow-focus-ring disabled:pointer-events-none disabled:opacity-45 data-pressed:bg-card data-pressed:text-small-strong data-pressed:text-primary-500 data-pressed:shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
