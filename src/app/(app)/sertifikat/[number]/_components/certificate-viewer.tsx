"use client";

import { DownloadIcon, FileTextIcon, MinusIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";

const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const ZOOM_STEP = 25;

export type CertificateViewerData = {
  number: string;
  issuer: string;
  title: string;
  recipient: string;
  eventTitle: string;
  issuedDateLabel: string;
  signer: string;
  finalScoreLabel: string;
  pdfHref: string;
};

/** Penampil pratinjau sertifikat A4 lanskap dengan kontrol zoom 50%–150% dan tombol unduh PDF. */
export function CertificateViewer({ data }: { data: CertificateViewerData }) {
  const [zoom, setZoom] = React.useState(100);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <h2 className="text-h3 text-foreground">Pratinjau sertifikat</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Kontrol perbesaran pratinjau"
            className="inline-flex items-center rounded-lg border border-input bg-card"
          >
            <button
              type="button"
              aria-label="Perkecil pratinjau"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              className="inline-flex size-8 items-center justify-center rounded-l-lg text-foreground outline-none hover:bg-muted focus-visible:shadow-focus-ring disabled:pointer-events-none disabled:opacity-40"
            >
              <MinusIcon aria-hidden="true" className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Atur ulang perbesaran ke 100%"
              onClick={() => setZoom(100)}
              className="min-w-13 px-2 text-center text-button-s text-foreground outline-none hover:bg-muted focus-visible:shadow-focus-ring"
            >
              {zoom}%
            </button>
            <button
              type="button"
              aria-label="Perbesar pratinjau"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              className="inline-flex size-8 items-center justify-center rounded-r-lg text-foreground outline-none hover:bg-muted focus-visible:shadow-focus-ring disabled:pointer-events-none disabled:opacity-40"
            >
              <PlusIcon aria-hidden="true" className="size-3.5" />
            </button>
          </div>
          <span className="text-small text-muted-foreground">1 / 1</span>
          <a href={data.pdfHref} className={buttonVariants({ size: "sm" })}>
            Unduh PDF
            <DownloadIcon aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="overflow-x-auto bg-muted p-3 sm:p-8">
        <div
          className="mx-auto transition-[width] duration-150"
          style={{
            width: zoom === 100 ? "100%" : `${zoom}%`,
            maxWidth: `${Math.round((768 * zoom) / 100)}px`,
          }}
        >
          <article
            aria-label="Sertifikat"
            className="flex min-h-64 w-full flex-col items-center justify-between gap-3 overflow-hidden border-t-8 border-primary-500 bg-card px-4 py-5 text-center shadow-sm sm:aspect-[1.414] sm:min-h-0 sm:gap-0 sm:px-10 sm:py-8"
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-caption-strong text-primary-600 uppercase sm:text-small-strong">
                {data.issuer}
              </span>
              <span className="text-caption-s font-normal text-muted-foreground sm:text-caption">
                No. {data.number}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-h2 tracking-wide text-foreground sm:text-display">
                SERTIFIKAT
              </span>
              <span className="text-caption-s text-label uppercase sm:text-small-strong">
                {data.title}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-caption-s font-normal text-muted-foreground sm:text-small">
                Diberikan kepada
              </span>
              <span className="text-h3 text-primary-600 sm:text-display">
                {data.recipient}
              </span>
              <span className="text-caption-s font-normal text-muted-foreground sm:text-small">
                Telah menyelesaikan seluruh milestone pembelajaran pada acara
              </span>
              <span className="text-small-strong text-foreground sm:text-h2">
                {data.eventTitle}
              </span>
            </div>
            <div className="grid w-full grid-cols-3 items-end gap-2 text-caption-s font-normal sm:text-small">
              <div className="flex flex-col">
                <span className="font-semibold text-muted-foreground uppercase">
                  Tanggal terbit
                </span>
                <span className="text-foreground">{data.issuedDateLabel}</span>
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
                  Nilai akhir: {data.finalScoreLabel}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-4 py-3 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="flex items-center gap-2">
          <FileTextIcon aria-hidden="true" className="size-4" />
          No. {data.number}
        </span>
        <span>PDF · A4 lanskap · 1 halaman</span>
      </div>
    </section>
  );
}
