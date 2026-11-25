import { AwardIcon } from "lucide-react";

/** Kartu pratinjau nama pada e-sertifikat kelulusan acara. */
export function CertificatePreview({
  title,
  name,
}: {
  title: string;
  name: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-5">
      <h2 className="flex items-center gap-2 text-h3 text-foreground">
        <AwardIcon aria-hidden="true" className="size-4.5 text-primary-500" />
        {title}
      </h2>
      <p className="text-small text-label">
        Nama profil ini otomatis dicantumkan pada portofolio dan e-sertifikat
        kelulusan acara.
      </p>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-primary-300 bg-card px-4 py-5 text-center">
        <p className="text-overline text-primary-500 uppercase">
          Sertifikat penyelesaian acara
        </p>
        <p className="text-caption text-muted-foreground">Diberikan kepada</p>
        <p className="max-w-full border-b-2 border-primary-500 pb-2 text-h2 break-words text-foreground">
          {name || "Nama lengkap"}
        </p>
        <p className="text-caption text-muted-foreground">
          Peserta · Becraft Ruang Tumbuh Bersama
        </p>
      </div>
      <p className="text-caption text-label">
        Sertifikat yang sudah terbit sebelumnya tidak berubah otomatis saat nama
        diubah.
      </p>
    </section>
  );
}
