"use client";

import * as React from "react";

import { AuthDivider } from "@/components/layout/auth-panel";
import { GoogleButton } from "@/components/ui/google-button";
import { authClient } from "@/lib/auth-client";

/** Tombol Google; akun baru diarahkan ke "Lengkapi Data Google" (AA-03). */
function GoogleSignIn({ label }: { label: string }) {
  const [pending, setPending] = React.useState(false);
  return (
    <>
      <AuthDivider />
      <GoogleButton
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const { error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: "/masuk/lanjut",
            newUserCallbackURL: "/daftar/google",
            errorCallbackURL: "/masuk",
          });
          if (error) setPending(false);
        }}
      >
        {label}
      </GoogleButton>
    </>
  );
}

export { GoogleSignIn };
