import * as React from "react";
import { cn } from "cn";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

function SearchInput({
  className,
  placeholder = "Cari…",
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
      />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-9"
        {...props}
      />
    </div>
  );
}

export { SearchInput };
