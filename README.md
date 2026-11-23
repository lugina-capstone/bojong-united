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
| Preset shadcn               | `base-nova`, token warna diganti dari Figma                          |
| Lucide React                | 1.78.0                                                               |
| Font                        | Inter melalui `next/font`                                            |
| Utilitas UI                 | `cn` 0.5.2, `class-variance-authority` 0.7.1, `tw-animate-css` 1.4.0 |

Gunakan npm dan pertahankan `package-lock.json`. Tidak perlu menginisialisasi ulang shadcn atau memasang ulang library UI.

## Struktur folder

```text
src/
  app/
    globals.css          # Tailwind dan design token dari Figma
    icon.svg             # Ikon aplikasi
    layout.tsx           # Metadata, bahasa, dan font global
    page.tsx             # Halaman awal
    api/auth/[...all]/   # Endpoint Better Auth
    api/files/           # Upload dan download file
    api/v1/              # API integrasi FOMO dan COMMIT (API key)
  components/
    ui/                  # Komponen shadcn/ui Base UI dengan preset Nova
  generated/prisma/      # Prisma Client hasil generate (diabaikan git)
  lib/
    auth.ts              # Konfigurasi Better Auth (server-only)
    auth-client.ts       # Klien Better Auth untuk komponen client
    session.ts           # getCurrentUser, requireUser, requirePermission
    rbac.ts              # Peran, label, dan peta izin
    email.ts             # Pengirim email SMTP (server-only)
    storage.ts           # Object storage S3: URL upload/download sementara (server-only)
    api/                 # API key, rate limit, withApiClient, dan OpenAPI untuk /api/v1
    db.ts                # Prisma Client bersama (server-only)
    env.ts               # Validasi environment variable dengan Zod
    validations/         # Skema Zod untuk form
    utils.ts             # Ekspor helper cn
  proxy.ts               # Redirect ke /masuk untuk pengunjung tanpa sesi
prisma/
  schema.prisma          # Model database
  migrations/            # Migrasi SQL
  seed.ts                # Membuat akun Administrator pertama
scripts/
  api-key.ts             # Membuat, mengganti, dan mencabut API key
docker/
  seaweedfs/s3.json      # Kredensial S3 lokal
docs/
  frontend-verification.md
.github/
  workflows/ci.yml       # CI: prisma validate, lint, format, typecheck, test, build
  pull_request_template.md
.husky/                  # Git hook pre-commit dan commit-msg
AGENTS.md                # Panduan agen dari Next.js dan konvensi proyek
CONTRIBUTING.md          # Alur branch, commit, dan PR
compose.yaml             # PostgreSQL, SeaweedFS, dan Mailpit lokal
.env.example             # Contoh environment variable
prisma.config.ts         # Konfigurasi Prisma CLI
vitest.config.mts        # Konfigurasi unit test
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
cp .env.example .env
npm run db:up
npm run db:migrate
```

`npm ci` juga menjalankan `prisma generate`. Build awal membutuhkan koneksi internet untuk pengambilan font oleh `next/font/google`; browser menerima font dari aset aplikasi sendiri.

## Database dan layanan lokal

Layanan lokal berjalan lewat Docker Compose (`compose.yaml`). Nilai di `.env.example` sudah cocok dengan layanan ini.

| Layanan                   | Alamat                                               | Kegunaan                                                        |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| PostgreSQL 17             | `localhost:5432`                                     | Database utama                                                  |
| SeaweedFS (S3-compatible) | `http://localhost:8333`, bucket `bojong-united`      | Upload materi, tugas, sertifikat. Production memakai R2 atau S3 |
| Mailpit                   | SMTP `localhost:1025`, inbox `http://localhost:8025` | Menangkap email verifikasi dan undangan                         |

| Script                      | Fungsi                                                               |
| --------------------------- | -------------------------------------------------------------------- |
| `npm run db:up` / `db:down` | Menyalakan atau mematikan layanan lokal                              |
| `npm run db:migrate`        | Membuat dan menerapkan migrasi dari perubahan `prisma/schema.prisma` |
| `npm run db:deploy`         | Menerapkan migrasi yang sudah ada (staging/production)               |
| `npm run db:seed`           | Membuat atau memperbarui akun Administrator dari `ADMIN_*` di `.env` |
| `npm run db:studio`         | Membuka Prisma Studio                                                |
| `npm run db:generate`       | Membuat ulang Prisma Client                                          |

Gunakan `db` dari `@/lib/db` untuk query, dan `env` dari `@/lib/env` untuk environment variable. Keduanya hanya bisa diimpor di kode server. App langsung error dengan daftar variable yang kurang jika `.env` tidak lengkap.

Model awal:

- `User`: email unik dan wajib huruf kecil (dijaga constraint database). `isAdministrator` menandai Administrator platform.
- `Organization`: `code` unik untuk bergabung, `status` `PENDING`, `APPROVED`, `REJECTED`, atau `DISABLED`.
- `Membership`: peran `GURU`, `ASESOR`, `TRAINER`, atau `ADMIN_ORGANISASI`. Satu user hanya bisa menjadi anggota satu organisasi. User tanpa membership adalah Peserta. Guru dan Asesor memiliki akses yang sama, tetapi labelnya berbeda.

- `Session`, `Account`, dan `Verification`: tabel Better Auth untuk sesi, metode login (`credential` atau `google`), serta token verifikasi email dan reset password.
- `File`: metadata file di object storage (key, nama asli, tipe, ukuran, pemilik, status `PENDING`/`UPLOADED`).
- `ApiClient` dan `ApiRateLimit`: aplikasi integrasi (FOMO, COMMIT), hash API key, scope, batas request per menit, dan hitungan request per menit.

## Autentikasi dan RBAC

Autentikasi memakai [Better Auth](https://www.better-auth.com) dengan sesi di database. Endpoint-nya ada di `/api/auth/*`.

- **Email + password:** password di-hash dengan scrypt, minimal 8 karakter. Email wajib diverifikasi sebelum bisa login. Email verifikasi dan reset password dikirim lewat SMTP; di lokal, buka inbox Mailpit di `http://localhost:8025`.
- **Google:** aktif jika `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` diisi. Redirect URI: `<BETTER_AUTH_URL>/api/auth/callback/google`. Akun Google dengan email yang sama otomatis ditautkan ke akun yang emailnya sudah terverifikasi.
- **Administrator pertama:** isi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di `.env`, lalu jalankan `npm run db:seed`.

Di komponen client, gunakan `authClient` dari `@/lib/auth-client` (`signIn.email`, `signIn.social`, `signUp.email`, `signOut`, `requestPasswordReset`, `resetPassword`). Skema form ada di `@/lib/validations/auth`.

Di server, gunakan helper dari `@/lib/session`:

| Helper                          | Fungsi                                                                     |
| ------------------------------- | -------------------------------------------------------------------------- |
| `getCurrentUser()`              | User yang login beserta `role` efektif dan membership-nya, atau `null`     |
| `requireUser()`                 | Sama, tetapi redirect ke `/masuk` jika belum login                         |
| `requirePermission(permission)` | Seperti `requireUser`, lalu menampilkan 404 jika peran tidak memiliki izin |

Helper ini membaca header request, jadi komponen yang memanggilnya harus berada di dalam `<Suspense>` (Cache Components aktif). Peran dan membership dibaca ulang dari database di setiap request, sehingga perubahan peran atau anggota yang dikeluarkan langsung berlaku. Route Handler memakai `hasPermission(user.role, permission)` dari `@/lib/rbac` dan membalas 401/403 sendiri. `src/proxy.ts` hanya mengecek ada atau tidaknya cookie sesi, bukan pengganti pengecekan izin.

Peran efektif (`role`) ditentukan oleh `resolveRole` di `@/lib/rbac`:

| Peran            | Kondisi                                                                 | Izin                                                                        |
| ---------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Administrator    | `isAdministrator = true`                                                | `organization:review`, `organization:manage`, `user:manage`                 |
| Admin Organisasi | Membership `ADMIN_ORGANISASI` di organisasi `APPROVED`                  | Semua izin Trainer, `member:manage`, `organization:update`                  |
| Trainer          | Membership `TRAINER` di organisasi `APPROVED`                           | Izin Guru ditambah `material:manage`                                        |
| Guru / Asesor    | Membership `GURU` atau `ASESOR` di organisasi `APPROVED`                | `event:manage`, `assessment:manage`                                         |
| Peserta          | Tanpa membership, atau organisasinya belum disetujui atau dinonaktifkan | `event:join`, `material:enroll`, `organization:create`, `organization:join` |

Label untuk UI tersedia di `roleLabels`. Tambahkan izin baru di `@/lib/rbac` bersama fiturnya, beserta unit test di `src/lib/rbac.test.ts`.

## Upload file

File disimpan di object storage (bucket privat), bukan di PostgreSQL. Browser mengirim file langsung ke storage memakai URL sementara (5 menit):

1. `POST /api/files` dengan `{ name, contentType, size }`. Server mengecek login, tipe, dan ukuran, lalu membalas `file.id` dan `upload` (`method`, `url`, `headers`).
2. Browser mengirim `PUT` ke `upload.url` dengan body file dan header `Content-Type` yang sama.
3. `POST /api/files/{id}/complete`. Server mengecek file di storage; jika ukuran atau tipenya berbeda, file dihapus dan dibalas 400.
4. `GET /api/files/{id}` mengarahkan (302) ke URL download sementara. Saat ini hanya pemilik dan Administrator yang boleh mengunduh; akses lain ditambahkan bersama fitur materi, tugas, dan sertifikat.

Tipe yang diterima: PDF, JPG, PNG, DOCX, PPTX, dan XLSX, maksimal 10 MB (`@/lib/validations/file`). Video dan file besar memakai link YouTube/Google Drive. Ekstensi nama file harus cocok dengan tipenya.

Di kode server, pakai `@/lib/storage` (`createUploadUrl`, `createDownloadUrl`, `getObjectInfo`, `deleteObject`), jangan membuat klien S3 sendiri. SeaweedFS lokal sudah mengizinkan CORS; untuk R2/S3 di production, atur CORS bucket agar origin aplikasi boleh `PUT` dan `GET`. Record `PENDING` yang tidak pernah diselesaikan akan dibersihkan oleh job terjadwal di tahap berikutnya.

## API integrasi (`/api/v1`)

Endpoint untuk tim FOMO dan COMMIT. Dokumentasi OpenAPI ada di `/api/v1/openapi.json`.

- **Autentikasi:** header `Authorization: Bearer <API key>`. Key berawalan `bu_`; database hanya menyimpan hash SHA-256 dan 11 karakter awalnya.
- **Scope:** setiap endpoint membutuhkan satu scope (`apiScopes` di `@/lib/api/api-key`). Saat ini hanya `health:read`.
- **Rate limit:** default 60 request per menit per API key, bisa diubah per key. Setiap respons memuat `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `X-RateLimit-Reset`; jika terlampaui, dibalas 429 dengan `Retry-After`.
- **Error:** semua error berbentuk `{ "error": { "code", "message" } }`.

| Endpoint                   | Scope         | Fungsi                       |
| -------------------------- | ------------- | ---------------------------- |
| `GET /api/v1/health`       | `health:read` | Cek koneksi dan API key      |
| `GET /api/v1/openapi.json` | -             | Dokumentasi OpenAPI (publik) |

| Script                                           | Fungsi                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `npm run api-key:create -- --name FOMO`          | Membuat API key (opsi `--scopes`, `--rate-limit`). Key tampil sekali |
| `npm run api-key:create -- --name FOMO --rotate` | Mengganti key lama dengan key baru                                   |
| `npm run api-key:revoke -- --name FOMO`          | Mencabut API key                                                     |

Endpoint baru dibuat di `src/app/api/v1/**/route.ts` dengan `withApiClient(scope, handler)` dari `@/lib/api/client`, scope baru ditambahkan ke `apiScopes`, dan endpoint-nya didaftarkan di `@/lib/api/openapi`.

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
npm test
```

`npm test` menjalankan unit test Vitest (`src/**/*.test.ts`). `typecheck` menjalankan `next typegen` sebelum `tsc --noEmit`, sehingga tipe route seperti `LayoutProps` tersedia pada clone baru. Gunakan `npm run format` untuk merapikan file dengan Prettier.

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
- GitHub Actions menjalankan lint, format check, typecheck, unit test, dan build pada setiap pull request.
- Alur branch, commit, dan PR dijelaskan di [CONTRIBUTING.md](CONTRIBUTING.md).

## Komponen UI

Komponen yang sudah tersedia di `src/components/ui`:

`badge`, `button`, `card`, `dialog`, `input`, `select`, `table`, `tabs`, dan `textarea`.

Halaman awal menggunakan `Card`, `CardContent`, dan `Badge`, beserta ikon Lucide. Komponen lain dipertahankan sebagai fondasi yang sudah tersedia. Token warna dan radius dipusatkan di `globals.css`; Inter dipetakan ke token font Tailwind. Tidak ada design system tambahan atau library UI kedua.

## Design token dan slicing

Sumber desain adalah file Figma `redesign`: page **Final** (frame desktop 1440×1024) dan page **Komponen**. Token di `src/app/globals.css` diambil dari collection variable **Lugina** dan text style `Lugina/*`. Collection "Supaste" di file Figma adalah sisa lama dan tidak dipakai. Untuk saat ini hanya ada mode terang.

| Jenis                      | Class Tailwind                                                                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warna semantik (shadcn)    | `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`, `bg-primary`, `text-destructive`                                                                                        |
| Palet                      | `primary-50…900`, `success-*`, `warning-*`, `danger-*` (50/200/500/700), `text-label`, `text-subtle`, `bg-overlay`                                                                                                               |
| Tone (badge/avatar/sampul) | `bg-tone-{blue,sage,peach,slate,lilac,sand}-bg` dengan `text-tone-…-fg`                                                                                                                                                          |
| Tipografi                  | `text-hero` 36, `text-display` 28, `text-stat` 26, `text-h2` 20, `text-h3` 15, `text-body` 13 (default body), `text-small` 12, `text-caption` 11, `text-overline` 11. Varian Medium/Strong memakai `font-medium`/`font-semibold` |
| Radius                     | `rounded-sm` 6, `rounded-md` 8, `rounded-lg` 10, `rounded-xl` 12, `rounded-2xl` 16, `rounded-full` untuk pill                                                                                                                    |
| Motion                     | `ease-standard`, `duration-(--duration-fast)` 150 ms, `--duration-base` 200 ms, `--duration-slow` 350 ms                                                                                                                         |

Radius Figma yang tidak ada di skala (misalnya 7, 9, 11) dibulatkan ke nilai terdekat. Spacing memakai skala 4px bawaan Tailwind.

### Aturan responsif

Frame Figma 1440 px adalah acuan desktop, bukan lebar tetap.

- Tulis class mobile-first: class dasar untuk HP, lalu `sm:` 640, `md:` 768, `lg:` 1024, `xl:` 1280, `2xl:` 1536.
- Jangan menyalin lebar/tinggi piksel dari Figma ke container. Pakai `w-full`, `max-w-*`, flex/grid, dan `min-h-*`.
- Sidebar berubah menjadi drawer (`Sheet`) di bawah `lg`. Grid kartu turun kolom di layar kecil. Tabel lebar dibungkus `overflow-x-auto`.
- Input dan textarea memakai `text-base` (16 px) di mobile dan `md:text-body` di desktop, supaya iOS tidak auto-zoom.
- Periksa setiap halaman di lebar 375, 768, 1366, 1440, dan 1920 px tanpa scroll horizontal.

## Status dan tahap berikutnya

Halaman awal menampilkan identitas Bojong United, SMK Lugina Rancaekek, deskripsi sistem, dan status pengembangan. Frontend ini belum menyediakan login, navigasi Guru–Siswa, dashboard, atau assessment. Database, layanan lokal, autentikasi (API), RBAC, upload file, dan kerangka API integrasi FOMO dan COMMIT sudah tersedia; halaman login dan daftar dibuat saat slicing UI. Endpoint data untuk FOMO dan COMMIT dibuat bersama fiturnya, dan deployment dikerjakan pada tahap berikutnya.

Rencana frontend berikutnya, setelah kebutuhan serta cakupannya disetujui:

1. Menyepakati alur, konten, dan wireframe Guru–Siswa dengan stakeholder.
2. Menyiapkan layout bersama dan komponen lintas fitur sesuai pemakaian nyata.
3. Mengembangkan tampilan fitur secara bertahap dengan data mock, termasuk empty, loading, dan error state.
4. Menambah pengujian interaksi dan aksesibilitas serta validasi lintas browser sesuai halaman yang dikembangkan.
5. Mengevaluasi pembaruan ESLint dan perbaikan dependency CLI shadcn secara terkontrol.
