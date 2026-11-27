import { RotateCcwIcon } from "lucide-react";
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
        Alasan dari Administrator: “
        {detail?.rejectionReason ??
          "Administrator belum menuliskan alasan penolakan."}
        ” Data sebelumnya akan terisi otomatis saat mengajukan ulang.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {user.membership?.isAdmin && (
          <Link
            href="/daftar/organisasi/ajukan-ulang"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <RotateCcwIcon aria-hidden="true" />
            Ajukan ulang
          </Link>
        )}
        <a
          href="mailto:dukungan@becraft.id"
          className="text-small-strong text-danger-500 hover:underline"
        >
          Hubungi dukungan
        </a>
        <form action={signOutAction}>
          <Button
            size="sm"
            variant="ghost"
            type="submit"
            className="text-danger-700 hover:bg-danger-100"
          >
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
        <Alert tone="warning" title="Akun menunggu persetujuan">
          Pengajuan organisasi Anda sedang ditinjau Administrator. Anda bisa
          masuk setelah menerima email persetujuan.
        </Alert>
      );
    case "disetujui":
      return (
        <Alert tone="success" title="Organisasi disetujui">
          Pengajuan organisasi Anda sudah disetujui Administrator. Masuk untuk
          mulai mengelola organisasi.
        </Alert>
      );
    case "nonaktif":
      return (
        <Alert tone="neutral" title="Organisasi dinonaktifkan">
          Organisasi Anda sedang dinonaktifkan oleh Administrator, sehingga akun
          anggotanya tidak dapat masuk. Hubungi admin organisasi atau{" "}
          <a
            href="mailto:dukungan@becraft.id"
            className="text-small-strong text-foreground underline"
          >
            dukungan@becraft.id
          </a>
          .
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
  let email = typeof params.email === "string" ? params.email : undefined;
  if (!email && status === "ditolak") {
    const user = await getCurrentUser();
    if (user?.membership?.organization.status === "REJECTED") {
      email = user.email;
    }
  }
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
