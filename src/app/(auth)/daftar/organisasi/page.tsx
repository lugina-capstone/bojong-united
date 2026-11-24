import type { Metadata } from "next";

import { RouteChoice } from "@/app/(auth)/daftar/organisasi/route-choice";

export const metadata: Metadata = { title: "Daftar sebagai organisasi" };

export default function DaftarOrganisasiPage() {
  return <RouteChoice />;
}
