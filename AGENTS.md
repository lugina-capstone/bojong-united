<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Konvensi proyek

- Gunakan npm dan pertahankan `package-lock.json`.
- Sebelum selesai, jalankan `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`, dan `npm run build`.
- Commit mengikuti Conventional Commits; lihat `CONTRIBUTING.md`.
- UI memakai komponen `src/components/ui` (shadcn/ui, Base UI) dan token tema di `src/app/globals.css`. Jangan hardcode warna, radius, atau font.
- Slicing mengikuti Figma `redesign` (page Final dan Komponen) dan memakai token di bagian "Design token dan slicing" README: `text-body`, `text-h2`, `bg-tone-sage-bg`, dan seterusnya.
- Setiap halaman wajib responsif. Frame 1440 px adalah acuan desktop, jadi tulis class mobile-first, jangan menyalin lebar piksel tetap, dan cek di lebar 375, 768, 1366, 1440, dan 1920 px. Lihat "Aturan responsif" di README.
- Ikon memakai `lucide-react`.
- Setiap page, Server Action, dan Route Handler yang butuh login memanggil `requireUser`/`requirePermission` dari `@/lib/session` (atau `hasPermission` dari `@/lib/rbac` di Route Handler). Jangan mengandalkan `src/proxy.ts` atau pengecekan di UI untuk otorisasi. Lihat "Autentikasi dan RBAC" di README.
- Alias `@/*` mengarah ke `src/*`.
