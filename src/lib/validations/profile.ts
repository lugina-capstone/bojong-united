import { z } from "zod";

/** Nomor HP Indonesia: menerima spasi, strip, titik, dan awalan +62/62; disimpan sebagai "08…". */
export function normalizePhone(value: string) {
  const digits = value.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+62")) return `0${digits.slice(3)}`;
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  return digits;
}

/** "085711220074" → "0857-1122-0074" */
export function formatPhone(phone: string) {
  return phone.match(/.{1,4}/g)?.join("-") ?? phone;
}

const name = z
  .string()
  .trim()
  .min(1, { error: "Nama lengkap wajib diisi" })
  .max(100, { error: "Nama maksimal 100 karakter" });

const phone = z
  .string()
  .transform(normalizePhone)
  .pipe(
    z.union([
      z.literal(""),
      z.string().regex(/^08\d{8,11}$/, {
        error: "Nomor HP harus diawali 08 dan berisi 10–13 angka",
      }),
    ]),
  )
  .transform((value) => value || null);

export const profileSchema = z.object({ name, phone });

const newPassword = z
  .string()
  .min(8, { error: "Kata sandi minimal 8 karakter" })
  .max(128, { error: "Kata sandi maksimal 128 karakter" });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Kata sandi saat ini wajib diisi" }),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Konfirmasi kata sandi tidak sama",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    error: "Kata sandi baru harus berbeda dari kata sandi saat ini",
  });
