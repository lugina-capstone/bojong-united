import type { Metadata } from "next";

import {
  LegalDocument,
  type LegalSection,
} from "@/app/(legal)/_components/legal-document";

export const metadata: Metadata = { title: "Ketentuan Layanan" };

const SECTIONS: LegalSection[] = [
  {
    title: "Penerimaan ketentuan",
    paragraphs: [
      "Dengan membuat akun atau memakai Becraft, Anda menyetujui Ketentuan Layanan ini. Jika tidak setuju, jangan memakai Becraft.",
    ],
  },
  {
    title: "Akun",
    paragraphs: [
      "Anda wajib memberikan data yang benar dan menjaga kerahasiaan kata sandi. Semua aktivitas di akun Anda menjadi tanggung jawab Anda.",
      "Akun dikunci sementara setelah beberapa kali gagal masuk untuk melindungi keamanan akun.",
    ],
  },
  {
    title: "Organisasi",
    paragraphs: [
      "Pendaftaran organisasi ditinjau oleh Administrator. Admin organisasi bertanggung jawab atas anggota, kode organisasi, serta acara dan materi yang dibuat di organisasinya.",
    ],
  },
  {
    title: "Konten dan karya",
    paragraphs: [
      "Karya yang Anda unggah tetap milik Anda. Anda memberi izin kepada Becraft untuk menyimpan dan menampilkannya kepada pihak yang berwenang, seperti penilai acara.",
      "Dilarang mengunggah konten yang melanggar hukum, hak cipta pihak lain, atau norma kesusilaan.",
    ],
  },
  {
    title: "Penghapusan akun",
    paragraphs: [
      "Anda dapat menghapus akun kapan saja. Data pribadi dihapus permanen, sedangkan data acara dan penilaian tetap tersimpan di organisasi terkait.",
    ],
  },
  {
    title: "Perubahan ketentuan",
    paragraphs: [
      "Ketentuan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan diumumkan melalui Becraft.",
    ],
  },
];

export default function KetentuanPage() {
  return (
    <LegalDocument
      title="Ketentuan Layanan"
      updatedAt="24 November 2026"
      sections={SECTIONS}
    />
  );
}
