-- Satu pengajuan Trainer yang menunggu per anggota per organisasi.
-- Sisakan pengajuan PENDING terbaru bila sudah ada duplikat.
DELETE FROM "trainer_requests" t
USING "trainer_requests" newer
WHERE t."status" = 'PENDING'
  AND newer."status" = 'PENDING'
  AND newer."userId" = t."userId"
  AND newer."organizationId" = t."organizationId"
  AND (newer."createdAt", newer."id") > (t."createdAt", t."id");

CREATE UNIQUE INDEX "trainer_requests_pending_key" ON "trainer_requests"("userId", "organizationId") WHERE "status" = 'PENDING';
