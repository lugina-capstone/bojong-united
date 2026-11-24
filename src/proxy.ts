import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/masuk",
  "/daftar",
  "/lupa-password",
  "/reset-password",
  "/akun-dihapus",
];

// Pengecekan optimistis (hanya ada atau tidaknya cookie sesi).
// Otorisasi sebenarnya tetap di server lewat `requireUser`/`requirePermission`.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDevTool =
    process.env.NODE_ENV !== "production" && pathname.startsWith("/dev/");
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith("/daftar/") ||
    isDevTool ||
    getSessionCookie(request)
  ) {
    return NextResponse.next();
  }

  const url = new URL("/masuk", request.url);
  url.searchParams.set("callbackURL", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
