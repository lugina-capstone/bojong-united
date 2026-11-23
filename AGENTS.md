<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Konvensi proyek

- Gunakan npm dan pertahankan `package-lock.json`.
- Sebelum selesai, jalankan `npm run lint`, `npm run format:check`, `npm run typecheck`, dan `npm run build`.
- Commit mengikuti Conventional Commits; lihat `CONTRIBUTING.md`.
- UI memakai komponen `src/components/ui` (shadcn/ui, Base UI) dan token tema di `src/app/globals.css`. Jangan hardcode warna, radius, atau font.
- Ikon memakai `lucide-react`.
- Alias `@/*` mengarah ke `src/*`.
