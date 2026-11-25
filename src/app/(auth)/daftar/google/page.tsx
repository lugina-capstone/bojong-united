import type { Metadata } from "next";
import { Suspense } from "react";

import { GoogleProfileForm } from "@/app/(auth)/daftar/google/google-profile-form";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatPhone } from "@/lib/validations/profile";

export const metadata: Metadata = { title: "Lengkapi data akun Google" };

async function GoogleProfileContent() {
  const user = await requireUser();
  const { phone } = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { phone: true },
  });
  return (
    <GoogleProfileForm
      name={user.name}
      email={user.email}
      phone={phone ? formatPhone(phone) : ""}
    />
  );
}

export default function DaftarGooglePage() {
  return (
    <Suspense>
      <GoogleProfileContent />
    </Suspense>
  );
}
