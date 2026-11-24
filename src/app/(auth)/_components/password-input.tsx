"use client";

import { EyeIcon, EyeOffIcon, LockKeyholeIcon } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";

function PasswordInput(props: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOffIcon : EyeIcon;
  return (
    <div className="relative w-full">
      <LockKeyholeIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
      />
      <Input type={visible ? "text" : "password"} className="px-9" {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-sm text-subtle hover:text-foreground"
      >
        <Icon aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

export { PasswordInput };
