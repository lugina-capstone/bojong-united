"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-input bg-card transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-primary-500 focus-visible:shadow-focus-ring disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger-500 data-checked:border-primary-500 data-checked:bg-primary-500 data-checked:text-inverse",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
