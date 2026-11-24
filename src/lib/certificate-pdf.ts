import "server-only";

import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";

import type { CertificateData } from "@/lib/certificate";
import { formatDate, formatScore } from "@/lib/format";

const PRIMARY = rgb(0.145, 0.388, 0.922);
const INK = rgb(0.067, 0.094, 0.153);
const MUTED = rgb(0.392, 0.455, 0.545);

/** Font standar PDF hanya mendukung Latin-1; karakter lain diganti "?". */
function latin1(text: string) {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

/** Sertifikat A4 lanskap satu halaman. */
export async function renderCertificatePdf(data: CertificateData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Sertifikat ${data.number}`);
  pdf.setAuthor(data.issuer);
  const page = pdf.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const center = (
    text: string,
    y: number,
    size: number,
    font: PDFFont,
    color = INK,
    x = width / 2,
  ) => {
    const safe = latin1(text);
    page.drawText(safe, {
      x: x - font.widthOfTextAtSize(safe, size) / 2,
      y,
      size,
      font,
      color,
    });
  };

  page.drawRectangle({
    x: 0,
    y: height - 14,
    width,
    height: 14,
    color: PRIMARY,
  });
  center(data.issuer.toUpperCase(), height - 80, 14, bold, PRIMARY);
  center(`No. ${data.number}`, height - 100, 10, regular, MUTED);
  center("SERTIFIKAT", height - 160, 44, bold);
  center(data.title.toUpperCase(), height - 190, 14, bold, MUTED);
  center("Diberikan kepada", height - 230, 12, regular, MUTED);
  center(data.recipient, height - 275, 34, bold, PRIMARY);
  center(
    "Telah menyelesaikan seluruh milestone pembelajaran pada acara",
    height - 305,
    12,
    regular,
    MUTED,
  );
  center(data.eventTitle, height - 340, 20, bold);
  center(data.signer, height - 395, 14, bold);
  center("Penanggung jawab", height - 412, 10, regular, MUTED);
  center("TANGGAL TERBIT", height - 455, 9, bold, MUTED, width * 0.3);
  center(
    formatDate(data.issuedAt),
    height - 475,
    12,
    regular,
    INK,
    width * 0.3,
  );
  center("HASIL PENCAPAIAN", height - 455, 9, bold, MUTED, width * 0.7);
  center(
    `Nilai akhir: ${formatScore(data.finalScore)}`,
    height - 475,
    12,
    regular,
    INK,
    width * 0.7,
  );
  center("Becraft - Pembelajaran berbasis proyek", 40, 9, regular, MUTED);
  return pdf.save();
}
