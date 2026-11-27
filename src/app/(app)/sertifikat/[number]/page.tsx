import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CertificateViewer } from "@/app/(app)/sertifikat/[number]/_components/certificate-viewer";
import { buttonVariants } from "@/components/ui/button";
import { loadCertificate } from "@/lib/certificate";
import { formatDate, formatDateTime, formatScore } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sertifikat" };

export default async function CertificatePage({
  params,
}: PageProps<"/sertifikat/[number]">) {
  const user = await requireUser();
  const { number } = await params;
  const data = await loadCertificate(decodeURIComponent(number), user);
  if (!data) notFound();
  const backHref = data.isOwner
    ? `/portofolio/${data.eventId}`
    : `/ruang-kerja/tugas/${data.eventId}`;

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        {data.isOwner ? (
          <>
            <Link href="/portofolio" className="hover:text-foreground">
              Portofolio pribadi
            </Link>{" "}
            /{" "}
            <Link
              href={`/portofolio/${data.eventId}`}
              className="hover:text-foreground"
            >
              {data.eventTitle}
            </Link>{" "}
            / Sertifikat
          </>
        ) : (
          <>{data.eventTitle} / Sertifikat</>
        )}
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-foreground">
            Sertifikat pembelajaran PjBL
          </h1>
          <p className="text-small text-muted-foreground">
            {data.eventTitle} · {data.recipient}
          </p>
        </div>
        <Link
          href={backHref}
          className={buttonVariants({
            variant: "secondary",
            className: "w-fit",
          })}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Kembali ke acara
        </Link>
      </div>

      <CertificateViewer
        data={{
          number: data.number,
          issuer: data.issuer,
          title: data.title,
          recipient: data.recipient,
          eventTitle: data.eventTitle,
          issuedDateLabel: formatDate(data.issuedAt),
          signer: data.signer,
          finalScoreLabel: formatScore(data.finalScore),
          pdfHref: `/api/sertifikat/${encodeURIComponent(data.number)}/pdf`,
        }}
      />

      <dl className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">Penerima</dt>
          <dd className="text-body-strong text-foreground">{data.recipient}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">
            Terbit otomatis
          </dt>
          <dd className="text-body-strong text-foreground">
            {formatDateTime(data.issuedAt)} WIB
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">
            Nilai akhir acara
          </dt>
          <dd className="text-body-strong text-foreground">
            {formatScore(data.finalScore)} / 100 · KKM {data.kkm}
          </dd>
        </div>
      </dl>
    </div>
  );
}
