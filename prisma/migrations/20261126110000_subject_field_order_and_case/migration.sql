-- Urutan chip bidang bawaan mengikuti Figma: UI/UX, Basis Data, Poster, Umum.
ALTER TABLE "subject_fields" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
UPDATE "subject_fields" SET "position" = 1 WHERE "id" = 'field_uiux';
UPDATE "subject_fields" SET "position" = 2 WHERE "id" = 'field_basis_data';
UPDATE "subject_fields" SET "position" = 3 WHERE "id" = 'field_poster';
UPDATE "subject_fields" SET "position" = 4 WHERE "id" = 'field_umum';

-- Gabungkan bidang organisasi yang namanya hanya berbeda huruf besar/kecil ke bidang tertua.
WITH ranked AS (
  SELECT "id",
         first_value("id") OVER (
           PARTITION BY "organizationId", lower("name")
           ORDER BY "createdAt", "id"
         ) AS keep_id
  FROM "subject_fields"
  WHERE "organizationId" IS NOT NULL
), moved_events AS (
  UPDATE "events" e SET "fieldId" = r.keep_id
  FROM ranked r WHERE e."fieldId" = r."id" AND r."id" <> r.keep_id
), moved_rubrics AS (
  UPDATE "rubrics" x SET "fieldId" = r.keep_id
  FROM ranked r WHERE x."fieldId" = r."id" AND r."id" <> r.keep_id
)
DELETE FROM "subject_fields" f USING ranked r WHERE f."id" = r."id" AND r."id" <> r.keep_id;

CREATE UNIQUE INDEX "subject_fields_organization_lower_name_key" ON "subject_fields"("organizationId", lower("name")) WHERE "organizationId" IS NOT NULL;
