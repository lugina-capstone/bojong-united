import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";

const name = process.env["ADMIN_NAME"]?.trim() || "Administrator";
const email = process.env["ADMIN_EMAIL"]?.trim().toLowerCase() ?? "";
const password = process.env["ADMIN_PASSWORD"] ?? "";

if (!email || password.length < 8) {
  throw new Error(
    "Isi ADMIN_EMAIL dan ADMIN_PASSWORD (minimal 8 karakter) di .env sebelum menjalankan seed.",
  );
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

async function main() {
  const user = await db.user.upsert({
    where: { email },
    update: { isAdministrator: true, emailVerified: true },
    create: { email, name, isAdministrator: true, emailVerified: true },
  });

  const hash = await hashPassword(password);
  await db.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: user.id },
    },
    update: { password: hash },
    create: {
      providerId: "credential",
      accountId: user.id,
      userId: user.id,
      password: hash,
    },
  });

  console.log(`Administrator siap: ${email}`);
}

main().finally(() => db.$disconnect());
