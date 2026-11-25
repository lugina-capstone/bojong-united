import type { Metadata } from "next";
import Link from "next/link";

import { loadParticipantProfile } from "../_components/load-profile";
import { ProfileForm } from "../_components/profile-form";

export const metadata: Metadata = { title: "Edit informasi profil" };

export default async function EditParticipantProfilePage() {
  const profile = await loadParticipantProfile();
  return (
    <div className="flex flex-col gap-4">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        Akun /{" "}
        <Link href="/profil" className="hover:text-foreground">
          Profil
        </Link>{" "}
        / Edit informasi
      </nav>
      <ProfileForm
        initial={{ name: profile.name, phone: profile.phone }}
        email={profile.email}
        emailNote={profile.emailNote}
      />
    </div>
  );
}
