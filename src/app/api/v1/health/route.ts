import { withApiClient } from "@/lib/api/client";
import type { HealthResponse } from "@/lib/api/schemas";
import { db } from "@/lib/db";

export const GET = withApiClient("health:read", async (_request, client) => {
  await db.$queryRaw`SELECT 1`;
  const body: HealthResponse = {
    status: "ok",
    client: client.name,
    time: new Date().toISOString(),
  };
  return Response.json(body);
});
