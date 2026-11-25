import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { SignInForm } from "@/app/(auth)/masuk/sign-in-form";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { googleEnabled } from "@/lib/auth";
import { safeCallbackPath } from "@/lib/auth-routing";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Masuk" };

async function RejectedAlert() {
  const user = await getCurrentUser();
  const organization = user?.membership?.organization;
  if (!user || organization?.status !== "REJECTED") return null;
  const detail = await db.organization.findUnique({
    where: { id: organization.id },
    select: { rejectionReason: true },
  });
  return (
    <Alert tone="danger" title="Pengajuan organisasi ditolak">
      <p>
        {detail?.rejectionReason ??
          "Administrator belum menuliskan alasan penolakan."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {user.membership?.isAdmin && (
          <Link
            href="/daftar/organisasi/ajukan-ulang"
            className={buttonVariants({ size: "sm" })}
          >
            Ajukan ulang
          </Link>
        )}
        <form action={signOutAction}>
          <Button size="sm" variant="secondary" type="submit">
            Keluar
          </Button>
        </form>
      </div>
    </Alert>
  );
}

function GoogleErrorAlert() {
  return (
    <Alert tone="danger" title="Masuk dengan Google gagal">
      Proses masuk dengan Google tidak selesai. Coba lagi, atau masuk dengan
      email dan kata sandi.
    </Alert>
  );
}

function StatusAlert({ status }: { status?: string }) {
  switch (status) {
    case "menunggu":
      return (
        <Alert tone="warning" title="Pengajuan organisasi sedang ditinjau">
          Administrator Becraft meninjau pengajuan Anda. Kami kirim email
          setelah pengajuan disetujui atau ditolak.
        </Alert>
      );
    case "nonaktif":
      return (
        <Alert tone="neutral" title="Organisasi dinonaktifkan">
          Organisasi Anda sedang dinonaktifkan oleh Administrator Becraft.
          Hubungi admin organisasi atau Administrator untuk informasi lebih
          lanjut.
        </Alert>
      );
    case "ditolak":
      return <RejectedAlert />;
    default:
      return null;
  }
}

async function MasukContent({ searchParams }: PageProps<"/masuk">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const email = typeof params.email === "string" ? params.email : undefined;
  return (
    <SignInForm
      googleEnabled={googleEnabled}
      defaultEmail={email}
      callbackURL={safeCallbackPath(params.callbackURL)}
      statusAlert={
        params.error ? <GoogleErrorAlert /> : <StatusAlert status={status} />
      }
    />
  );
}

export default function MasukPage(props: PageProps<"/masuk">) {
  return (
    <Suspense>
      <MasukContent {...props} />
    </Suspense>
  );
}
