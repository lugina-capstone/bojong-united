import "server-only";

import type { Prisma } from "@/generated/prisma/client";

/** Pengajuan hanya tampil di antrean jika email pemohon (admin pertama) sudah terverifikasi. */
export const verifiedApplicant = {
  members: { some: { isAdmin: true, user: { emailVerified: true } } },
} satisfies Prisma.OrganizationWhereInput;

/** Pemohon = admin organisasi paling awal. */
export const applicantSelect = {
  members: {
    where: { isAdmin: true },
    orderBy: { createdAt: "asc" },
    take: 1,
    select: {
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          accounts: { select: { providerId: true } },
        },
      },
    },
  },
} satisfies Prisma.OrganizationSelect;

export function startOfMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
