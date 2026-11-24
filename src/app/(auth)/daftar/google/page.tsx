import type { Metadata } from "next";
import { Suspense } from "react";

import { GoogleProfileForm } from "@/app/(auth)/daftar/google/google-profile-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Lengkapi data akun Google" };

async function GoogleProfileContent() {
  const user = await requireUser();
  return <GoogleProfileForm name={user.name} email={user.email} />;
}

export default function DaftarGooglePage() {
  return (
    <Suspense>
      <GoogleProfileContent />
    </Suspense>
  );
}
