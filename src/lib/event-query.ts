import type { Prisma } from "@/generated/prisma/client";

/** Filter fase acara terbit: berlangsung, belum dimulai, atau berakhir. */
export function phaseWhere(phase: string, now: Date): Prisma.EventWhereInput {
  switch (phase) {
    case "berlangsung":
      return {
        status: "PUBLISHED",
        startsAt: { lte: now },
        endsAt: { gt: now },
      };
    case "belum":
      return { status: "PUBLISHED", startsAt: { gt: now } };
    case "berakhir":
      return {
        OR: [
          { status: "CLOSED" },
          { status: "PUBLISHED", endsAt: { lte: now } },
        ],
      };
    default:
      return {};
  }
}

/** Acara yang tampil di Jelajah: terbit/ditutup dari organisasi yang aktif. */
export const visibleEventWhere = {
  status: { in: ["PUBLISHED", "CLOSED"] },
  organization: { status: "APPROVED" },
} satisfies Prisma.EventWhereInput;
