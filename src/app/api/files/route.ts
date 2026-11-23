import { randomUUID } from "node:crypto";

import { apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createUploadUrl } from "@/lib/storage";
import { uploadRequestSchema } from "@/lib/validations/file";

/**
 * Langkah 1 upload: validasi tipe dan ukuran, lalu buat URL PUT sementara.
 * Browser mengirim file langsung ke storage, lalu memanggil POST /api/files/{id}/complete.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(401, "unauthorized", "Silakan masuk terlebih dahulu");
  }

  const parsed = uploadRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return apiError(
      400,
      "invalid_request",
      parsed.error.issues[0]?.message ?? "Data upload tidak valid",
    );
  }

  const { name, contentType, size } = parsed.data;
  const file = await db.file.create({
    data: {
      key: `uploads/${user.id}/${randomUUID()}`,
      name,
      contentType,
      size,
      ownerId: user.id,
    },
    select: { id: true, key: true, name: true, contentType: true, size: true },
  });

  const url = await createUploadUrl(file);
  return Response.json(
    {
      file: {
        id: file.id,
        name: file.name,
        contentType: file.contentType,
        size: file.size,
      },
      upload: { method: "PUT", url, headers: { "Content-Type": contentType } },
    },
    { status: 201 },
  );
}
