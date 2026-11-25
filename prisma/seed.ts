import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";
import { signUpSchema } from "../src/lib/validations/auth";
import { seedDemo } from "./seed-demo";

const admin = signUpSchema.omit({ terms: true }).safeParse({
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

  const demoPassword = process.env["DEMO_PASSWORD"] ?? "";
  if (!demoPassword) {
    console.log("DEMO_PASSWORD kosong, data demo dilewati.");
    return;
  }
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("Data demo tidak boleh dibuat di production.");
  }
  if (demoPassword.length < 8) {
    throw new Error("DEMO_PASSWORD minimal 8 karakter.");
  }
  // Satu transaksi: seed yang gagal di tengah tidak meninggalkan data demo setengah jadi.
  await db.$transaction(
    (tx) => seedDemo(tx, { password: demoPassword, administratorId: user.id }),
    { maxWait: 10_000, timeout: 120_000 },
  );
}

main().finally(() => db.$disconnect());
