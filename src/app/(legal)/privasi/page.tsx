import type { Metadata } from "next";

import {
  LegalDocument,
  type LegalSection,
} from "@/app/(legal)/_components/legal-document";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

const SECTIONS: LegalSection[] = [
  {
    title: "Data yang kami kumpulkan",
    paragraphs: [
      "Nama, email, kata sandi terenkripsi, data organisasi, serta karya, nilai, dan riwayat belajar yang Anda buat di Becraft.",
    ],
  },
  {
    title: "Penggunaan data",
    paragraphs: [
      "Data dipakai untuk menjalankan akun, acara, materi, penilaian, sertifikat, dan portofolio, serta untuk mengirim email seperti kode verifikasi dan tautan atur ulang kata sandi.",
    ],
  },
  {
    title: "Berbagi data",
    paragraphs: [
      "Data hanya dibagikan kepada anggota organisasi yang berwenang, misalnya Guru atau Asesor yang menilai karya Anda. Kami tidak menjual data pribadi.",
    ],
  },
  {
    title: "Penyimpanan dan keamanan",
    paragraphs: [
      "File disimpan secara privat dan hanya dapat diakses lewat tautan sementara. Kata sandi disimpan dalam bentuk terenkripsi.",
    ],
  },
  {
    title: "Hak Anda",
    paragraphs: [
      "Anda dapat memperbarui data profil dan menghapus akun kapan saja. Setelah akun dihapus, data pribadi dihapus permanen dan email dapat dipakai mendaftar lagi.",
    ],
  },
  {
    title: "Kontak",
    paragraphs: [
      "Pertanyaan tentang privasi dapat disampaikan kepada pengelola Becraft di SMK Lugina Rancaekek.",
    ],
  },
];

export default function PrivasiPage() {
  return (
    <LegalDocument
      title="Kebijakan Privasi"
      updatedAt="24 November 2026"
      sections={SECTIONS}
    />
  );
}
