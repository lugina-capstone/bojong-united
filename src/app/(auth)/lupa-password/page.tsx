import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/app/(auth)/lupa-password/forgot-password-form";

export const metadata: Metadata = { title: "Lupa kata sandi" };

export default function LupaPasswordPage() {
  return <ForgotPasswordForm />;
}
