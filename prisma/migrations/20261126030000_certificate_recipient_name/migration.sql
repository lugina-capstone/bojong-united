-- AlterTable
ALTER TABLE "certificates" ADD COLUMN "recipientName" TEXT;

-- Sertifikat lama memakai nama profil saat migrasi dijalankan.
UPDATE "certificates" c
SET "recipientName" = u."name"
FROM "enrollments" e
JOIN "users" u ON u."id" = e."userId"
WHERE e."id" = c."enrollmentId";

ALTER TABLE "certificates" ALTER COLUMN "recipientName" SET NOT NULL;
