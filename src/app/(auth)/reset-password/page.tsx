import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form";

export const metadata: Metadata = { title: "Atur ulang kata sandi" };

async function ResetContent({ searchParams }: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;
  const valid = typeof token === "string" && !error;
  return <ResetPasswordForm token={valid ? token : undefined} />;
}

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <Suspense>
      <ResetContent {...props} />
    </Suspense>
  );
}
