import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";
import { signUpSchema } from "../src/lib/validations/auth";

const admin = signUpSchema.safeParse({
  name: process.env["ADMIN_NAME"] || "Administrator",
  email: process.env["ADMIN_EMAIL"] ?? "",
  password: process.env["ADMIN_PASSWORD"] ?? "",
});

if (!admin.success) {
  const issues = admin.error.issues
    .map(
      (issue) =>
        `- ADMIN_${String(issue.path[0]).toUpperCase()}: ${issue.message}`,
    )
    .join("\n");
  throw new Error(`Isi akun Administrator di .env dengan benar:\n${issues}`);
}

const { name, email, password } = admin.data;

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
