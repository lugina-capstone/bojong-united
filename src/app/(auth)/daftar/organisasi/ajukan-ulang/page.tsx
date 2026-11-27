import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ResubmitForm } from "@/app/(auth)/daftar/organisasi/ajukan-ulang/resubmit-form";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ajukan ulang organisasi" };

async function ResubmitContent() {
  const user = await requireUser();
  const membership = await db.membership.findUnique({
    where: { userId: user.id },
    select: {
      isAdmin: true,
      organization: {
        select: { name: true, type: true, status: true, rejectionReason: true },
      },
    },
  });
  if (!membership?.isAdmin || membership.organization.status !== "REJECTED")
    redirect("/masuk");
  const { organization } = membership;
  return (
    <ResubmitForm
      initial={{
        organizationName: organization.name,
        organizationType: organization.type,
      }}
      applicantName={user.name}
      applicantEmail={user.email}
      rejectionReason={organization.rejectionReason}
    />
  );
}

export default function AjukanUlangPage() {
  return (
    <Suspense>
      <ResubmitContent />
    </Suspense>
  );
}
