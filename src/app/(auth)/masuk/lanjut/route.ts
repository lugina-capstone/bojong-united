import { redirect } from "next/navigation";

import { homeHref } from "@/app/(auth)/actions";

/** Tujuan setelah masuk dengan Google: beranda sesuai role atau layar status. */
export async function GET() {
  redirect(await homeHref());
}
