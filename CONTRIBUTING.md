# Panduan kontribusi

## Persiapan

1. Gunakan Node.js sesuai `.nvmrc` (`nvm use`).
2. Jalankan `npm ci`. Script `prepare` memasang git hook Husky, dan `postinstall` membuat Prisma Client.
3. Salin `.env.example` ke `.env`, lalu jalankan `npm run db:up`, `npm run db:migrate`, dan `npm run db:seed` (butuh Docker).
4. Setelah mengubah `prisma/schema.prisma`, jalankan `npm run db:migrate -- --name <deskripsi>` dan commit folder migrasinya.

## Alur kerja

1. Buat branch dari `main` dengan format `<tipe>/<deskripsi-singkat>`, misalnya `feat/login-page` atau `fix/navbar-overflow`.
2. Commit memakai [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`. Scope opsional, misalnya `feat(auth): ...`.
3. Buka pull request ke `main` dan isi template PR. CI harus hijau dan minimal satu reviewer menyetujui sebelum merge.

## Pemeriksaan otomatis

| Kapan        | Yang dijalankan                                            |
| ------------ | ---------------------------------------------------------- |
| `pre-commit` | ESLint dan Prettier pada file yang di-stage (lint-staged)  |
| `commit-msg` | Commitlint (Conventional Commits)                          |
| Pull request | Lint, format check, typecheck, dan build di GitHub Actions |

Jalankan manual sebelum push:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run build
```

Gunakan `npm run format` untuk merapikan seluruh file.
