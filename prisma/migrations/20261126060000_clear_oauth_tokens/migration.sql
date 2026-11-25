-- Token OAuth tidak dipakai setelah masuk, jadi tidak disimpan lagi.
UPDATE "accounts"
SET "accessToken" = NULL,
    "refreshToken" = NULL,
    "idToken" = NULL,
    "accessTokenExpiresAt" = NULL,
    "refreshTokenExpiresAt" = NULL
WHERE "accessToken" IS NOT NULL
   OR "refreshToken" IS NOT NULL
   OR "idToken" IS NOT NULL;
