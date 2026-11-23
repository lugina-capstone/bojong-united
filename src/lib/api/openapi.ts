import { createDocument } from "zod-openapi";

import { errorResponseSchema, healthResponseSchema } from "@/lib/api/schemas";

const error = (description: string) => ({
  description,
  content: { "application/json": { schema: errorResponseSchema } },
});

/** Dokumentasi /api/v1 untuk tim FOMO dan COMMIT. Daftarkan setiap endpoint baru di sini. */
export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Bojong United API",
    version: "1.0.0",
    description:
      "API integrasi untuk FOMO dan COMMIT. Semua endpoint memakai header `Authorization: Bearer <API key>` dan dibatasi per API key per menit (lihat header `X-RateLimit-*`).",
  },
  servers: [{ url: "/api/v1" }],
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: { type: "http", scheme: "bearer", description: "API key bu_..." },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Cek koneksi dan API key",
        description: "Scope: `health:read`.",
        responses: {
          "200": {
            description: "API key valid",
            content: { "application/json": { schema: healthResponseSchema } },
          },
          "401": error("API key tidak ada atau tidak valid"),
          "403": error("API key tidak memiliki scope"),
          "429": error("Rate limit terlampaui; lihat header Retry-After"),
        },
      },
    },
  },
});
