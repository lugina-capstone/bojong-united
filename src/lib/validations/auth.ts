import { z } from "zod";

import { OTP_LENGTH } from "@/lib/otp";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Format email tidak valid" }));

const password = z
  .string()
  .min(8, { error: "Kata sandi minimal 8 karakter" })
  .max(128, { error: "Kata sandi maksimal 128 karakter" });

const name = z
  .string()
  .trim()
  .min(1, { error: "Nama lengkap wajib diisi" })
  .max(100, { error: "Nama maksimal 100 karakter" });

const terms = z.literal(true, {
  error: "Setujui Ketentuan Layanan dan Kebijakan Privasi",
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Kata sandi wajib diisi" }),
  rememberMe: z.boolean().default(true),
});

export const signUpSchema = z.object({ name, email, password, terms });

export const otpSchema = z.object({
  email,
  otp: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), {
    error: `Masukkan ${OTP_LENGTH} digit kode verifikasi`,
  }),
});

/** Kode organisasi disimpan huruf besar; spasi dan huruf kecil dari input dinormalisasi. */
export const organizationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(4, { error: "Kode organisasi wajib diisi" })
  .max(32, { error: "Kode organisasi tidak valid" });

export const joinOrganizationSchema = signUpSchema.extend({
  code: organizationCodeSchema,
});

export const organizationTypes = [
  "SEKOLAH_UNIVERSITAS",
  "LEMBAGA",
  "PERUSAHAAN",
  "INSTANSI_LAINNYA",
] as const;

export const organizationDataSchema = z.object({
  organizationType: z.enum(organizationTypes, {
    error: "Pilih jenis organisasi",
  }),
  organizationName: z
    .string()
    .trim()
    .min(3, { error: "Nama organisasi minimal 3 karakter" })
    .max(120, { error: "Nama organisasi maksimal 120 karakter" }),
});

export const registerOrganizationSchema = signUpSchema.extend(
  organizationDataSchema.shape,
);

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Konfirmasi kata sandi tidak sama",
  });

export const MAX_LOGO_SIZE = 2 * 1024 * 1024;
export const logoContentTypes = ["image/png", "image/jpeg"] as const;

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type RegisterOrganizationInput = z.infer<
  typeof registerOrganizationSchema
>;
