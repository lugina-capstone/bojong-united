import "server-only";

import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email pemberitahuan sederhana; kegagalan kirim dicatat tanpa menggagalkan aksi. */
export async function sendNoticeEmail(input: {
  to: string;
  subject: string;
  paragraphs: string[];
  link?: { label: string; path: string };
}) {
  const url = input.link
    ? new URL(input.link.path, env.BETTER_AUTH_URL).toString()
    : null;
  const text = [...input.paragraphs, url ? `${input.link!.label}: ${url}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const html = [
    ...input.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    url ? `<p><a href="${url}">${escapeHtml(input.link!.label)}</a></p>` : "",
  ].join("");
  try {
    await sendEmail({ to: input.to, subject: input.subject, text, html });
  } catch (error) {
    console.error(`Gagal mengirim email "${input.subject}"`, error);
  }
}
