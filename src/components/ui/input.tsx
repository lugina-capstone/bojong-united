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

/** Input dengan ikon Lucide di kiri, mis. ikon surat untuk email. */
function InputWithIcon({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Icon
        aria-hidden={true}
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
      />
      <Input className="pl-9" {...props} />
    </div>
  );
}

export { Input, InputWithIcon, fieldControlClass };
