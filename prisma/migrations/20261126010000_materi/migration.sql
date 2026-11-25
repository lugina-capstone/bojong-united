-- Visibilitas materi, langkah draf wizard, dan estimasi durasi per bagian.
CREATE TYPE "MaterialVisibility" AS ENUM ('PUBLIC', 'EVENT_ONLY');

ALTER TABLE "materials"
  ADD COLUMN "visibility" "MaterialVisibility" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "draftStep" INTEGER NOT NULL DEFAULT 1;

UPDATE "materials" SET "draftStep" = 3 WHERE "status" <> 'DRAFT';

ALTER TABLE "material_sections" ADD COLUMN "durationMinutes" INTEGER;
