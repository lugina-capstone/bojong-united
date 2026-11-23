import "server-only";

import { hashApiKey, parseBearerToken, type ApiScope } from "@/lib/api/api-key";
import { getRateLimitState, getWindowStart } from "@/lib/api/rate-limit";
import { apiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export type ApiClientInfo = { id: string; name: string; scopes: string[] };

/** Satu request dihitung secara atomik per API client per menit. Mengembalikan jumlah request di menit ini. */
async function countRequest(clientId: string, windowStart: Date) {
  const [row] = await db.$queryRaw<[{ count: number }]>`
    INSERT INTO "api_rate_limits" ("clientId", "windowStart", "count")
    VALUES (${clientId}, ${windowStart}, 1)
    ON CONFLICT ("clientId", "windowStart")
    DO UPDATE SET "count" = "api_rate_limits"."count" + 1
    RETURNING "count"`;

  if (row.count === 1) {
    // Request pertama di menit baru: hapus jendela lama dan catat waktu terakhir dipakai.
    await db.$transaction([
      db.apiRateLimit.deleteMany({
        where: { clientId, windowStart: { lt: windowStart } },
      }),
      db.apiClient.update({
        where: { id: clientId },
        data: { lastUsedAt: new Date() },
      }),
    ]);
  }
  return row.count;
}

/**
 * Wajib dipakai oleh semua Route Handler di /api/v1: cek API key, rate limit, dan scope,
 * lalu menambahkan header X-RateLimit-* ke respons.
 */
export function withApiClient<Context = unknown>(
  scope: ApiScope,
  handler: (
    request: Request,
    client: ApiClientInfo,
    context: Context,
  ) => Promise<Response>,
) {
  const handle = async (
    request: Request,
    context: Context,
  ): Promise<Response> => {
    const key = parseBearerToken(request.headers.get("authorization"));
    if (!key) {
      return apiError(
        401,
        "unauthorized",
        "Sertakan header Authorization: Bearer <API key>",
        { headers: { "WWW-Authenticate": "Bearer" } },
      );
    }

    const client = await db.apiClient.findUnique({
      where: { keyHash: hashApiKey(key) },
      select: {
        id: true,
        name: true,
        scopes: true,
        rateLimit: true,
        revokedAt: true,
      },
    });
    if (!client || client.revokedAt) {
      return apiError(401, "unauthorized", "API key tidak valid", {
        headers: { "WWW-Authenticate": "Bearer" },
      });
    }

    const now = new Date();
    const windowStart = getWindowStart(now);
    const count = await countRequest(client.id, windowStart);
    const rateLimit = getRateLimitState(
      count,
      client.rateLimit,
      windowStart,
      now,
    );
    if (!rateLimit.allowed) {
      return apiError(
        429,
        "rate_limited",
        `Batas ${client.rateLimit} request per menit terlampaui`,
        {
          headers: {
            ...rateLimit.headers,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    let response: Response;
    if (!client.scopes.includes(scope)) {
      response = apiError(
        403,
        "insufficient_scope",
        `API key tidak memiliki scope ${scope}`,
      );
    } else {
      response = await handler(request, client, context);
    }

    for (const [name, value] of Object.entries(rateLimit.headers)) {
      response.headers.set(name, value);
    }
    return response;
  };

  return async (request: Request, context: Context) => {
    try {
      return await handle(request, context);
    } catch (error) {
      console.error(`[api/v1] ${request.method} ${request.url}`, error);
      return apiError(500, "internal_error", "Terjadi kesalahan server");
    }
  };
}
