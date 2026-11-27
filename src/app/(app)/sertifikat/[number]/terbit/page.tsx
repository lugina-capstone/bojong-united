import {
  ArrowLeftIcon,
  BellIcon,
  CircleCheckIcon,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { loadCertificate } from "@/lib/certificate";
import { formatDate, formatDateTime, formatScore } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sertifikat Terbit" };

export default async function CertificateIssuedPage({
  params,
}: PageProps<"/sertifikat/[number]/terbit">) {
  const user = await requireUser();
  const { number } = await params;
  const data = await loadCertificate(decodeURIComponent(number), user);
  if (!data) notFound();

  const backHref = data.isOwner
    ? `/portofolio/${data.eventId}`
    : `/ruang-kerja/tugas/${data.eventId}`;
  const encodedNumber = encodeURIComponent(data.number);
  const viewHref = `/sertifikat/${encodedNumber}`;
  const pdfHref = `/api/sertifikat/${encodedNumber}/pdf`;

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
        <div className="flex flex-col gap-1.5">
          <h1 className="text-display text-foreground">
            Sertifikat Anda telah terbit
          </h1>
          <p className="text-small text-muted-foreground">
            Pencapaian dari {data.eventTitle} tersimpan di portofolio Anda.
          </p>
        </div>
        <Link
          href={backHref}
          className={buttonVariants({
            variant: "secondary",
            className: "w-fit shrink-0",
          })}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Kembali ke acara
        </Link>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-success-200 bg-success-50 p-4 sm:flex-row sm:items-center sm:gap-3.5 sm:px-5 sm:py-4">
        <CircleCheckIcon
          aria-hidden="true"
          className="size-6 shrink-0 text-success-600"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-foreground">
            Seluruh syarat telah terpenuhi
          </h2>
          <p className="text-small text-muted-foreground">
            Sertifikat diterbitkan otomatis. Anda dapat melihat dan mengunduhnya
            kapan saja dari acara ini.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <section className="flex flex-col gap-4.5 rounded-xl border border-border bg-card p-5 lg:col-span-7">
          <div className="px-0 py-1 sm:px-4">
            <article
              aria-label="Pratinjau sertifikat"
              className="mx-auto flex min-h-64 w-full flex-col items-center justify-between gap-3 overflow-hidden rounded-sm border border-t-8 border-border border-t-primary-500 bg-card px-4 py-5 text-center sm:aspect-[1.414] sm:min-h-0 sm:gap-0 sm:px-8 sm:py-6"
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-caption-strong text-primary-600 uppercase">
                  {data.issuer}
                </span>
                <span className="text-caption-s font-normal text-muted-foreground">
                  No. {data.number}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <span className="text-h2 tracking-wide text-foreground sm:text-display">
                  SERTIFIKAT
                </span>
                <span className="text-caption-s text-label uppercase sm:text-caption-strong">
                  {data.title}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <span className="text-caption-s font-normal text-muted-foreground sm:text-caption">
                  Diberikan kepada
                </span>
                <span className="text-h2 text-primary-600 sm:text-display">
                  {data.recipient}
                </span>
                <span className="text-caption-s font-normal text-muted-foreground sm:text-caption">
                  Telah menyelesaikan seluruh milestone pembelajaran pada acara
                </span>
                <span className="text-small-strong text-foreground sm:text-h3">
                  {data.eventTitle}
                </span>
              </div>

              <div className="grid w-full grid-cols-3 items-end gap-2 text-caption-s font-normal sm:text-caption">
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
                  <span className="text-muted-foreground">
                    Penanggung jawab
                  </span>
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

          <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
            <FileTextIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-primary-500"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-h3 text-label">
                Sertifikat {data.eventTitle}
              </p>
              <p className="text-caption text-muted-foreground">
                PDF · A4 lanskap · No. {data.number}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={viewHref}
              className={buttonVariants({ size: "lg", className: "w-full" })}
            >
              Lihat sertifikat
            </Link>
            <a
              href={pdfHref}
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "w-full",
              })}
            >
              Unduh PDF
              <DownloadIcon aria-hidden="true" />
            </a>
          </div>
        </section>

        <aside className="flex flex-col gap-4.5 lg:col-span-5">
          <section className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5">
            <h2 className="text-h2 text-foreground">Rincian penerbitan</h2>
            <dl className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-0.5">
                <dt className="text-caption text-muted-foreground">Penerima</dt>
                <dd className="text-body-strong text-label">
                  {data.recipient}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-caption text-muted-foreground">Acara</dt>
                <dd className="text-body-strong text-label">
                  {data.eventTitle}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-caption text-muted-foreground">
                  Terbit otomatis
                </dt>
                <dd className="text-body-strong text-label">
                  {formatDateTime(data.issuedAt)} WIB
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-caption text-muted-foreground">
                  Nilai akhir
                </dt>
                <dd className="text-body-strong text-label">
                  {formatScore(data.finalScore)} / 100
                </dd>
              </div>
            </dl>
          </section>

          <section className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5">
            <h2 className="text-h2 text-foreground">Semua syarat terpenuhi</h2>
            <ul className="flex flex-col gap-2.5 text-small text-label">
              <li className="flex items-start gap-2">
                <CircleCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-success-600"
                />
                <span>
                  Tugas dan survei: {data.milestoneCount} dari{" "}
                  {data.milestoneCount} selesai
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-success-600"
                />
                <span>
                  Penilaian: {data.milestoneCount} dari {data.milestoneCount}{" "}
                  tersedia
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-success-600"
                />
                <span>
                  Nilai akhir {formatScore(data.finalScore)} ≥ minimum{" "}
                  {data.kkm}
                </span>
              </li>
            </ul>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl bg-primary-50 p-4 text-small text-muted-foreground">
            <BellIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary-500"
            />
            <p>
              Pemberitahuan penerbitan tersedia di notifikasi. Sertifikat tetap
              tersimpan pada portofolio per acara.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
