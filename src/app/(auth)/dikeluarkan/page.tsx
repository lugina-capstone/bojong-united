import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { homeHref } from "@/app/(auth)/actions";
import { RemovedChoice } from "@/app/(auth)/dikeluarkan/removed-choice";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Tidak lagi tergabung" };

async function RemovedContent() {
  const user = await requireUser();
  if (user.membership?.status !== "REMOVED") redirect(await homeHref());
  const membership = await db.membership.findUnique({
    where: { userId: user.id },
    select: { removedAt: true },
  });
  return (
    <RemovedChoice
      name={user.name}
      email={user.email}
      organizationName={user.membership.organization.name}
      removedAt={
        membership?.removedAt?.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) ?? null
      }
    />
  );
}

export default function DikeluarkanPage() {
  return (
    <Suspense>
      <RemovedContent />
    </Suspense>
  );
}
