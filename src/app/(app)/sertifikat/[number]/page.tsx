import { ArrowLeftIcon, DownloadIcon, FileTextIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    ? `/acara/${data.eventId}`
    : `/ruang-kerja/acara/${data.eventId}`;

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        {data.isOwner && (
          <>
            <Link href="/portofolio" className="hover:text-foreground">
              Portofolio
            </Link>{" "}
            /{" "}
          </>
        )}
        {data.eventTitle} / Sertifikat
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-foreground">
            Sertifikat pembelajaran
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

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <h2 className="text-h3 text-foreground">Pratinjau sertifikat</h2>
          <a
            href={`/api/sertifikat/${encodeURIComponent(data.number)}/pdf`}
            className={buttonVariants({ size: "sm" })}
          >
            Unduh PDF
            <DownloadIcon aria-hidden="true" />
          </a>
        </div>
        <div className="bg-muted p-3 sm:p-8">
          <article
            aria-label="Sertifikat"
            className="mx-auto flex aspect-[1.414] w-full max-w-3xl flex-col items-center justify-between overflow-hidden border-t-8 border-primary-500 bg-card px-4 py-4 text-center shadow-sm sm:px-10 sm:py-8"
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-caption-strong text-primary-600 uppercase sm:text-small-strong">
                {data.issuer}
              </span>
              <span className="text-[0.625rem] text-muted-foreground sm:text-caption">
                No. {data.number}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-h2 tracking-wide text-foreground sm:text-display">
                SERTIFIKAT
              </span>
              <span className="text-[0.625rem] font-semibold text-label uppercase sm:text-small-strong">
                {data.title}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-[0.625rem] text-muted-foreground sm:text-small">
                Diberikan kepada
              </span>
              <span className="text-h3 text-primary-600 sm:text-display">
                {data.recipient}
              </span>
              <span className="text-[0.625rem] text-muted-foreground sm:text-small">
                Telah menyelesaikan seluruh milestone pembelajaran pada acara
              </span>
              <span className="text-small-strong text-foreground sm:text-h2">
                {data.eventTitle}
              </span>
            </div>
            <div className="grid w-full grid-cols-3 items-end gap-2 text-[0.625rem] sm:text-small">
              <div className="flex flex-col">
                <span className="font-semibold text-muted-foreground uppercase">
                  Tanggal terbit
                </span>
                <span className="text-foreground">
                  {formatDate(data.issuedAt)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  {data.signer}
                </span>
                <span className="text-muted-foreground">Penanggung jawab</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-muted-foreground uppercase">
                  Hasil pencapaian
                </span>
                <span className="text-foreground">
                  Nilai akhir: {formatScore(data.finalScore)}
                </span>
              </div>
            </div>
          </article>
        </div>
        <div className="flex flex-col gap-1 px-4 py-3 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="flex items-center gap-2">
            <FileTextIcon aria-hidden="true" className="size-4" />
            No. {data.number}
          </span>
          <span>PDF · A4 lanskap · 1 halaman</span>
        </div>
      </section>

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
            {formatDateTime(data.issuedAt)}
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
