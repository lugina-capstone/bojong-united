import type { Metadata } from "next";

import { SignUpForm } from "@/app/(auth)/daftar/sign-up-form";
import { googleEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Daftar" };

export default function DaftarPage() {
  return <SignUpForm googleEnabled={googleEnabled} />;
}
