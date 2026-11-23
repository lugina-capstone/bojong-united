import "server-only";

import { z } from "zod";

// String kosong di .env dianggap tidak diisi.
const optional = z
  .string()
  .optional()
  .transform((value) => value || undefined);

// Secret contoh dari .env.example diketahui publik; siapa pun bisa memalsukan token verifikasi email dengannya.
const EXAMPLE_AUTH_SECRET = "dev-only-secret-ganti-di-production-0000";

// URL yang tidak valid dilaporkan oleh validasi BETTER_AUTH_URL sendiri.
const isLocalUrl = (url: string) => {
  const hostname = URL.parse(url)?.hostname;
  return !hostname || ["localhost", "127.0.0.1"].includes(hostname);
};

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    S3_ENDPOINT: z.url(),
    S3_REGION: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: optional,
    SMTP_PASSWORD: optional,
    EMAIL_FROM: z.string().min(1),
  })
  .refine(
    (env) =>
      env.BETTER_AUTH_SECRET !== EXAMPLE_AUTH_SECRET ||
      isLocalUrl(env.BETTER_AUTH_URL),
    {
      path: ["BETTER_AUTH_SECRET"],
      error:
        "Masih memakai secret contoh. Buat secret baru dengan `openssl rand -base64 32`",
    },
  );

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Environment variable tidak valid. Bandingkan .env dengan .env.example:\n${issues}`,
  );
}

export const env = parsed.data;
