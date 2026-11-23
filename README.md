# Bojong United V2

Digital Portfolio & Assessment System untuk **SMK Lugina Rancaekek**.

Proyek ini dimulai ulang dari nol. Status saat ini adalah **fondasi frontend**: konfigurasi frontend, komponen UI dasar, dan halaman awal responsif yang menjelaskan bahwa sistem sedang dikembangkan. Fitur Guru–Siswa belum diimplementasikan.

Repository: [lugina-capstone/bojong-united](https://github.com/lugina-capstone/bojong-united). Source proyek lama hanya menjadi arsip dan tidak digunakan di fondasi ini.

## Stack frontend

Versi berikut berasal dari dependency yang terpasang melalui `package-lock.json`:

| Teknologi                   | Versi / konfigurasi                                                  |
| --------------------------- | -------------------------------------------------------------------- |
| Next.js                     | 16.4.6, App Router, Turbopack                                        |
| React / React DOM           | 19.3.0                                                               |
| TypeScript                  | 5.9.3, strict mode                                                   |
| Tailwind CSS                | 4.3.3, loader `@tailwindcss/turbopack` 4.3.3                         |
| ESLint / eslint-config-next | 9.39.5 / 16.4.6                                                      |
| shadcn/ui                   | Source komponen lokal, CLI 4.23.0                                    |
| Base UI                     | `@base-ui/react` 1.9.0                                               |
| Preset shadcn               | `base-nova`, warna neutral                                           |
| Lucide React                | 1.78.0                                                               |
| Font                        | Geist Sans dan Geist Mono melalui `next/font`                        |
| Utilitas UI                 | `cn` 0.5.2, `class-variance-authority` 0.7.1, `tw-animate-css` 1.4.0 |

Gunakan npm dan pertahankan `package-lock.json`. Tidak perlu menginisialisasi ulang shadcn atau memasang ulang library UI.

## Struktur folder

```text
src/
  app/
    globals.css          # Tailwind dan theme tokens light/dark
    icon.svg             # Ikon aplikasi
    layout.tsx           # Metadata, bahasa, dan font global
    page.tsx             # Halaman awal
  components/
    ui/                  # Komponen shadcn/ui Base UI dengan preset Nova
  lib/
    utils.ts             # Ekspor helper cn
docs/
  frontend-verification.md
.github/
  workflows/ci.yml       # CI: lint, format, typecheck, build
  pull_request_template.md
.husky/                  # Git hook pre-commit dan commit-msg
AGENTS.md                # Panduan agen dari Next.js dan konvensi proyek
CONTRIBUTING.md          # Alur branch, commit, dan PR
components.json          # Konfigurasi shadcn dan alias
.nvmrc                   # Versi Node.js
.prettierrc.json         # Konfigurasi Prettier
commitlint.config.mjs
lint-staged.config.mjs
eslint.config.mjs
next.config.ts
package.json
package-lock.json
tsconfig.json
```

Alias `@/*` mengarah ke `src/*`. Routing tetap mengikuti konvensi Next.js App Router.

Struktur dikembangkan saat diperlukan: `components/layout` untuk layout yang digunakan bersama, `components/shared` untuk komponen lintas fitur, `hooks` untuk hook bersama, dan `types` untuk tipe bersama. Area `features/teacher`, `features/student`, serta `features/assessment` baru dibuat ketika tahap frontend fitur tersebut dimulai. Aset yang benar-benar dibutuhkan dapat ditempatkan di `public/images` atau `public/icons`, dan pengujian otomatis berikutnya di `tests`. Folder kosong serta file placeholder tidak ditambahkan.

## Instalasi

Gunakan Node.js **22.22.1 atau lebih baru** yang memenuhi kebutuhan dependency proyek. Lingkungan yang diverifikasi menggunakan Node.js 24.15.0 dan npm 11.12.1.

```bash
git clone https://github.com/lugina-capstone/bojong-united.git
cd bojong-united
npm ci
```

Fondasi ini tidak memerlukan file `.env`, database, atau layanan eksternal. Build awal membutuhkan koneksi internet untuk pengambilan font oleh `next/font/google`; browser menerima font dari aset aplikasi sendiri.

## Development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Pemeriksaan dan build

Jalankan lint, format, dan pemeriksaan tipe:

```bash
npm run lint
npm run format:check
npm run typecheck
```

`typecheck` menjalankan `next typegen` sebelum `tsc --noEmit`, sehingga tipe route seperti `LayoutProps` tersedia pada clone baru. Gunakan `npm run format` untuk merapikan file dengan Prettier.

Bangun aplikasi untuk produksi:

```bash
npm run build
npm run start
```

Perintah `start` menjalankan hasil build lokal; perintah ini bukan deployment.

Periksa kondisi keamanan dependency:

```bash
npm audit
```

Hasil verifikasi 23 November 2026: instalasi, ESLint, TypeScript, build, dan smoke test Chromium pada desktop, tablet, serta mobile berhasil. Audit mencatat **4 kerentanan moderate** pada rantai dependency CLI shadcn, tanpa high atau critical. Tidak dilakukan perubahan versi atau perbaikan paksa. Detail lingkungan, catatan dependency, hasil browser, dan batas pengujian tersedia di [laporan verifikasi](docs/frontend-verification.md).

## Konsistensi tim

- Versi Node.js dikunci di `.nvmrc` (22) dan `engines` (`>=22.22.1`, minimum lint-staged) di `package.json`.
- Prettier (dengan `prettier-plugin-tailwindcss`) merapikan kode dan mengurutkan class Tailwind; `eslint-config-prettier` mencegah bentrok dengan ESLint.
- `npm ci` memasang git hook Husky: `pre-commit` menjalankan lint-staged (ESLint + Prettier pada file yang di-stage) dan `commit-msg` menjalankan Commitlint (Conventional Commits).
- GitHub Actions menjalankan lint, format check, typecheck, dan build pada setiap pull request.
- Alur branch, commit, dan PR dijelaskan di [CONTRIBUTING.md](CONTRIBUTING.md).

## Komponen UI

Komponen yang sudah tersedia di `src/components/ui`:

`badge`, `button`, `card`, `dialog`, `input`, `select`, `table`, `tabs`, dan `textarea`.

Halaman awal menggunakan `Card`, `CardContent`, dan `Badge`, beserta ikon Lucide. Komponen lain dipertahankan sebagai fondasi yang sudah tersedia. Token warna dan radius dipusatkan di `globals.css`; Geist dipetakan ke token font Tailwind. Tidak ada design system tambahan atau library UI kedua.

## Status dan tahap berikutnya

Halaman awal menampilkan identitas Bojong United, SMK Lugina Rancaekek, deskripsi sistem, dan status pengembangan. Frontend ini belum menyediakan login, navigasi Guru–Siswa, dashboard, atau assessment. Backend, database, autentikasi, dan deployment berada di luar cakupan tahap ini.

Rencana frontend berikutnya, setelah kebutuhan serta cakupannya disetujui:

1. Menyepakati alur, konten, dan wireframe Guru–Siswa dengan stakeholder.
2. Menyiapkan layout bersama dan komponen lintas fitur sesuai pemakaian nyata.
3. Mengembangkan tampilan fitur secara bertahap dengan data mock, termasuk empty, loading, dan error state.
4. Menambah pengujian interaksi dan aksesibilitas serta validasi lintas browser sesuai halaman yang dikembangkan.
5. Mengevaluasi pembaruan ESLint dan perbaikan dependency CLI shadcn secara terkontrol.
