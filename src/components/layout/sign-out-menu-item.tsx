"use client";

import { LogOutIcon } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { MenuItem } from "@/components/ui/menu-item";

function SignOutMenuItem() {
  return (
    <MenuItem
      icon={LogOutIcon}
      label="Keluar"
      danger
      onClick={() => void signOutAction()}
    />
  );
}

export { SignOutMenuItem };
