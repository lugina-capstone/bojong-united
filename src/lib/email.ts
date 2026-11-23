import "server-only";

import nodemailer from "nodemailer";

import { env } from "@/lib/env";

const isLocalSmtp = ["localhost", "127.0.0.1"].includes(env.SMTP_HOST);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  // Link verifikasi dan reset password tidak boleh terkirim tanpa enkripsi (kecuali ke Mailpit lokal).
  requireTLS: !isLocalSmtp,
  auth: env.SMTP_USER
    ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
    : undefined,
});

type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(email: Email) {
  await transporter.sendMail({ from: env.EMAIL_FROM, ...email });
}
