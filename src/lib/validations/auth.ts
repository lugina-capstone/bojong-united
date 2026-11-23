import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Format email tidak valid" }));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Password wajib diisi" }),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, { error: "Nama wajib diisi" }),
  email,
  password: z
    .string()
    .min(8, { error: "Password minimal 8 karakter" })
    .max(128, { error: "Password maksimal 128 karakter" }),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
