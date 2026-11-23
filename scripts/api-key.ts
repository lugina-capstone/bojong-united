import "dotenv/config";

import { parseArgs } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import { apiScopes, generateApiKey, isApiScope } from "../src/lib/api/api-key";

const usage = `Pemakaian:
  npm run api-key:create -- --name FOMO [--scopes health:read] [--rate-limit 60] [--rotate]
  npm run api-key:revoke -- --name FOMO

Scope yang tersedia: ${apiScopes.join(", ")}`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: "string" },
    scopes: { type: "string" },
    "rate-limit": { type: "string" },
    rotate: { type: "boolean", default: false },
  },
});

const input = z
  .object({
    command: z.enum(["create", "revoke"]),
    name: z.string().trim().min(1, { error: "--name wajib diisi" }),
    scopes: z
      .array(z.string().refine(isApiScope, { error: "Scope tidak dikenal" }))
      .min(1)
      .optional(),
    rateLimit: z.coerce.number().int().positive().optional(),
  })
  .safeParse({
    command: positionals[0],
    name: values.name ?? "",
    scopes: values.scopes
      ?.split(",")
      .map((scope) => scope.trim())
      .filter(Boolean),
    rateLimit: values["rate-limit"],
  });

if (!input.success) {
  console.error(input.error.issues.map((issue) => issue.message).join("\n"));
  console.error(usage);
  process.exit(1);
}

const { command, name, scopes, rateLimit } = input.data;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

async function main() {
  try {
    if (command === "revoke") {
      await db.apiClient.update({
        where: { name },
        data: { revokedAt: new Date() },
      });
      console.log(`API key ${name} dicabut.`);
    } else {
      const existing = await db.apiClient.findUnique({ where: { name } });
      if (existing && !values.rotate) {
        throw new Error(
          `API client ${name} sudah ada. Tambahkan --rotate untuk mengganti key-nya.`,
        );
      }

      // Saat rotasi, scope dan batas lama dipertahankan kecuali diisi ulang.
      const settings = {
        scopes: scopes ?? existing?.scopes ?? ["health:read"],
        rateLimit: rateLimit ?? existing?.rateLimit ?? 60,
      };
      const { key, prefix, hash } = generateApiKey();
      const data = {
        keyPrefix: prefix,
        keyHash: hash,
        ...settings,
        revokedAt: null,
      };
      await db.apiClient.upsert({
        where: { name },
        create: { name, ...data },
        update: data,
      });

      console.log(
        [
          `API key untuk ${name} (scope: ${settings.scopes.join(", ")}, ${settings.rateLimit} request/menit):`,
          "",
          `  ${key}`,
          "",
          `Key ini hanya ditampilkan sekali. Kirim ke tim ${name} lewat saluran yang aman.`,
        ].join("\n"),
      );
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
