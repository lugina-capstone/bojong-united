import type { Metadata } from "next";

import { OrganizationForm } from "@/app/(auth)/daftar/organisasi/baru/organization-form";

export const metadata: Metadata = { title: "Daftarkan organisasi baru" };

export default function OrganisasiBaruPage() {
  return <OrganizationForm />;
}
