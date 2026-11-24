"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

/** Opsi format berkas (PDF, Gambar, Tautan, …) di pengaturan milestone. */
function FileFormatOption({
  className,
  children,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="file-format-option"
      className={cn(
        "group/format inline-flex h-9.5 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-2.25 text-caption text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring disabled:pointer-events-none disabled:opacity-45 data-checked:border-primary-300 data-checked:bg-primary-50 data-checked:text-primary-500",
        className,
      )}
      {...props}
    >
      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-input bg-card group-data-checked/format:border-primary-500 group-data-checked/format:bg-primary-500">
        <CheckboxPrimitive.Indicator>
          <CheckIcon aria-hidden="true" className="size-3 text-inverse" />
        </CheckboxPrimitive.Indicator>
      </span>
      {children}
    </CheckboxPrimitive.Root>
  );
}

export { FileFormatOption };
