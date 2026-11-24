import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

/** Gaya kolom bersama untuk Input, Select, SearchInput, dan Textarea. */
const fieldControlClass =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3 text-body text-foreground max-md:text-[1rem] transition-colors outline-none placeholder:text-subtle hover:border-subtle focus-visible:border-[1.5px] focus-visible:border-primary-500 focus-visible:shadow-focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-danger-500 aria-invalid:focus-visible:shadow-none";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        fieldControlClass,
        "h-11 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input, fieldControlClass };
