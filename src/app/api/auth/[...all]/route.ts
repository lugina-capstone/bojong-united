import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

/**
 * Hanya endpoint yang dibuka browser secara langsung (masuk dengan Google, tautan reset di email). Alur lain lewat
 * Server Action di `(auth)/actions.ts` dan `(app)/profil/actions.ts`, yang memvalidasi input,
 * membatasi laju, dan mengunci akun; membuka endpoint Better Auth lainnya melewati semua itu.
 */
const ALLOWED: Record<string, RegExp> = {
  GET: /^\/api\/auth\/(callback\/[^/]+|reset-password\/[^/]+|error|get-session)$/,
  POST: /^\/api\/auth\/(sign-in\/social|callback\/[^/]+)$/,
};

function guarded(method: "GET" | "POST") {
  return (request: Request) =>
    ALLOWED[method].test(new URL(request.url).pathname)
      ? handler[method](request)
      : Response.json({ message: "Not found" }, { status: 404 });
}

export const GET = guarded("GET");
export const POST = guarded("POST");
