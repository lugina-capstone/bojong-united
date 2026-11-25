import { redirect } from "next/navigation";

import { homeHref } from "@/app/(auth)/actions";

/** Tujuan setelah masuk dengan Google: beranda sesuai role atau layar status. */
export async function GET(request: Request) {
  const callbackURL = new URL(request.url).searchParams.get("callbackURL");
  redirect(await homeHref(callbackURL));
}
