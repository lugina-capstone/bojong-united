import type { Metadata } from "next";

import { JoinForm } from "@/app/(auth)/daftar/organisasi/gabung/join-form";

export const metadata: Metadata = { title: "Gabung ke organisasi" };

export default function GabungOrganisasiPage() {
  return <JoinForm />;
}
