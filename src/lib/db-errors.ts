import { Prisma } from "@/generated/prisma/client";

/** Pelanggaran unique constraint, mis. dua permintaan bersamaan membuat baris yang sama. */
export function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
