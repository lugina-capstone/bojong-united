-- CreateTable
CREATE TABLE "subject_fields" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subject_fields_organizationId_name_key" ON "subject_fields"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "subject_fields" ADD CONSTRAINT "subject_fields_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique index biasa membolehkan nama ganda saat organizationId NULL (bawaan).
CREATE UNIQUE INDEX "subject_fields_default_name_key" ON "subject_fields"("name") WHERE "organizationId" IS NULL;
CREATE UNIQUE INDEX "material_categories_default_name_key" ON "material_categories"("name") WHERE "organizationId" IS NULL;

-- Pilihan bawaan sesuai Figma (Bidang acara/rubrik) dan PRD-04 (kategori materi).
INSERT INTO "subject_fields" ("id", "name", "isDefault") VALUES
  ('field_uiux', 'UI/UX', true),
  ('field_basis_data', 'Basis Data', true),
  ('field_poster', 'Poster', true),
  ('field_umum', 'Umum', true);
INSERT INTO "material_categories" ("id", "name", "isDefault") VALUES
  ('category_desain_produk', 'Desain Produk', true),
  ('category_desain_komunikasi', 'Desain Komunikasi', true),
  ('category_teknologi', 'Teknologi', true),
  ('category_bisnis_data', 'Bisnis & Data', true)
ON CONFLICT ("name") WHERE "organizationId" IS NULL DO NOTHING;

-- Kategori teks lama dipetakan ke bidang bawaan dengan nama sama, selain itu ke "Umum".
ALTER TABLE "events" ADD COLUMN "fieldId" TEXT;
ALTER TABLE "rubrics" ADD COLUMN "fieldId" TEXT;

UPDATE "events" e
SET "fieldId" = COALESCE(
  (SELECT f."id" FROM "subject_fields" f WHERE f."organizationId" IS NULL AND f."name" = e."category"),
  'field_umum'
)
WHERE e."category" IS NOT NULL OR e."status" <> 'DRAFT';

UPDATE "rubrics" r
SET "fieldId" = COALESCE(
  (SELECT f."id" FROM "subject_fields" f WHERE f."organizationId" IS NULL AND f."name" = r."category"),
  'field_umum'
);

ALTER TABLE "events" DROP COLUMN "category";
ALTER TABLE "rubrics" DROP COLUMN "category",
ALTER COLUMN "fieldId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "events_fieldId_idx" ON "events"("fieldId");

-- CreateIndex
CREATE INDEX "rubrics_fieldId_idx" ON "rubrics"("fieldId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "subject_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "subject_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Acara yang sudah diterbitkan wajib punya bidang.
ALTER TABLE "events" ADD CONSTRAINT "events_field_required" CHECK ("status" = 'DRAFT' OR "fieldId" IS NOT NULL);
