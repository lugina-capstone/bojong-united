-- AlterTable
ALTER TABLE "users" ADD COLUMN "profileCompletedAt" TIMESTAMP(3);

-- Akun yang sudah ada dianggap sudah melengkapi data.
UPDATE "users" SET "profileCompletedAt" = "createdAt";
