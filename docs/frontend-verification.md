# Verifikasi fondasi frontend

Tanggal pemeriksaan: 23 November 2026.

## Lingkungan dan konfigurasi

- Windows, Node.js 24.15.0, npm 11.12.1.
- Next.js 16.4.6 App Router dan React/React DOM 19.3.0.
- TypeScript 5.9.3 dengan `strict: true` dan alias `@/*` ke `src/*`.
- Tailwind CSS dan loader `@tailwindcss/turbopack` 4.3.3; konfigurasi loader yang sudah ada dipertahankan. Tidak ditambahkan pipeline PostCSS kedua.
- shadcn CLI 4.23.0, Base UI 1.9.0, preset `base-nova`, warna dasar neutral, Lucide React 1.78.0.
- Geist dan Geist Mono melalui `next/font/google`; font disajikan sebagai aset lokal aplikasi. Pengunduhan font saat build awal memerlukan akses jaringan.
- Token tema light/dark, radius, warna, dan animasi shadcn dipertahankan. Pemetaan `--font-sans` yang sebelumnya merujuk ke dirinya sendiri diperbaiki menjadi `--font-geist-sans`; token heading menggunakan sumber yang sama.
- Versi, `package.json`, dan `package-lock.json` awal dipertahankan. Tidak ada dependency baru.

## Hasil perintah

| Pemeriksaan                                       | Hasil                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`                                          | Berhasil; 537 package terpasang, 538 diaudit. Ada peringatan deprecation ESLint dan hasil audit di bawah.                |
| `npm run lint`                                    | Berhasil, tanpa error atau warning ESLint.                                                                               |
| `npx tsc --noEmit`                                | Berhasil, tanpa TypeScript error.                                                                                        |
| `npm run build`                                   | Berhasil menggunakan Turbopack; halaman `/` dan ikon diprerender statis.                                                 |
| `npm run dev -- --hostname 127.0.0.1 --port 3000` | Berhasil; halaman awal mengembalikan HTTP 200.                                                                           |
| `npm ls --all --json`                             | Tidak ada dependency `invalid` atau `missing`; React, React DOM, Base UI, dan Tailwind menggunakan versi yang konsisten. |
| `npm audit`                                       | Dijalankan; menemukan 4 moderate, 0 high, 0 critical. Bukan hasil audit bersih.                                          |

`npm ls` menandai `@img/sharp-wasm32@0.35.5` dan `@emnapi/runtime@1.11.3` sebagai `extraneous`, termasuk setelah `npm ci`. Keduanya tercatat sebagai dependency opsional di lockfile; tidak ada konflik peer dependency. Tidak ada library UI kedua seperti Radix. Versi `cn` internal CLI shadcn berbeda dari versi aplikasi, tetapi seluruh komponen aplikasi mengimpor `cn@0.5.2` yang sama.

Saat instalasi, npm menampilkan deprecation untuk ESLint 9.39.5. Versi ESLint dan `eslint-config-next@16.4.6` dipertahankan; lint berhasil. Evaluasi pembaruan terkoordinasi dapat dilakukan pada tahap pemeliharaan berikutnya.

## Smoke test browser dan responsivitas

Pengujian dijalankan menggunakan Chromium headless melalui Playwright 1.65.0 yang sudah tersedia pada mesin, tanpa menambah dependency proyek. Screenshot desktop dan mobile diperiksa secara visual. Script serta hasil mentah berada di direktori sementara mesin dan tidak menjadi bagian source aplikasi.

| Viewport CSS           | HTTP | Overflow horizontal | Console/page error | Request gagal |
| ---------------------- | ---- | ------------------- | ------------------ | ------------- |
| Desktop 1440 × 900     | 200  | Tidak ada           | Tidak ada          | Tidak ada     |
| Tablet 768 × 1024      | 200  | Tidak ada           | Tidak ada          | Tidak ada     |
| Mobile 390 × 844       | 200  | Tidak ada           | Tidak ada          | Tidak ada     |
| Mobile kecil 320 × 700 | 200  | Tidak ada           | Tidak ada          | Tidak ada     |

Pemeriksaan pada masing-masing viewport:

- Judul dokumen, bahasa `id`, satu landmark `main`, heading Bojong United, deskripsi sistem, dan status pengembangan sesuai.
- Komponen Card dan Badge shadcn berhasil dirender.
- Geist benar-benar dimuat; computed font heading adalah `Geist, "Geist Fallback"`. Ukuran heading 72 px pada desktop/tablet dan 48 px pada mobile.
- Radius Card terhitung 14 px, sesuai token Nova; CSS Tailwind diterapkan.
- Tidak ada console warning, hydration error yang teramati, page error, request gagal, atau respons aset HTTP 4xx/5xx selama pemuatan halaman.
- Tidak ada resource browser dari origin eksternal.
- Pengaktifan kelas `.dark` melalui browser mengubah token latar dan tidak menyebabkan overflow. Tidak ditambahkan kontrol pergantian tema.

Batas verifikasi: Chromium pada viewport emulasi; belum diuji pada perangkat fisik, Safari, atau Firefox. Komponen UI lain sudah diperiksa lint dan TypeScript, tetapi alur interaksinya belum diuji karena belum digunakan pada halaman awal.

Untuk mengulang smoke test secara manual, jalankan development server, buka `/` di browser, lalu gunakan device toolbar pada ukuran di atas. Periksa heading dan Card, pastikan tidak ada scroll horizontal, buka Console/Network, lalu reload halaman. Aktifkan kelas `.dark` pada elemen `html` untuk memeriksa token tema.

## Catatan npm audit

Empat entri moderate berasal dari satu rantai dependency:

`shadcn → ts-morph → @ts-morph/common → minimatch`

Temuan dasar adalah potensi denial of service melalui globparts amplification pada `minimatch`, advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Versi terdampak yang dilaporkan adalah `>=7.0.0 <11.0.1`.

npm menawarkan perubahan ke `shadcn@1.0.0` dan menandainya sebagai perubahan major. Perubahan tersebut tidak diterapkan karena akan mengubah CLI yang dipilih proyek. Tidak menjalankan `npm audit fix --force`, tidak menambahkan override transitive tanpa pengujian, dan tidak mengklaim dependency bebas kerentanan. Pantau perbaikan rantai dependency pada rilis shadcn yang kompatibel.

## Cakupan

Hanya fondasi frontend dan halaman informasi pengembangan. Tidak ada backend, database, autentikasi, fitur bisnis, atau deployment. Folder fitur dan abstraksi tambahan sengaja belum dibuat sebelum ada pemakaian nyata.
