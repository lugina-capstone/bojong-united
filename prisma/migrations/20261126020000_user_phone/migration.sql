-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- Nomor HP disimpan sebagai digit saja dengan awalan 08.
ALTER TABLE "users" ADD CONSTRAINT "users_phone_format" CHECK ("phone" IS NULL OR "phone" ~ '^08[0-9]{8,11}$');
