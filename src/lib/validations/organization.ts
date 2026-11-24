import { z } from "zod";

import { organizationTypes } from "@/lib/validations/auth";

/** Alasan penolakan/penonaktifan organisasi oleh Administrator. */
export const organizationReasonSchema = z
  .string()
  .trim()
  .min(20, "Alasan minimal 20 karakter.")
  .max(300, "Alasan maksimal 300 karakter.");

/** Alasan penolakan pengajuan Trainer oleh Admin Organisasi. */
export const trainerRejectionSchema = z
  .string()
  .trim()
  .min(5, "Alasan minimal 5 karakter.")
  .max(300, "Alasan maksimal 300 karakter.");

export const organizationProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama organisasi minimal 3 karakter.")
    .max(100, "Nama organisasi maksimal 100 karakter."),
  type: z.enum(organizationTypes, "Pilih jenis organisasi."),
  contactEmail: z
    .union([z.literal(""), z.email("Format email tidak valid.")])
    .optional(),
  contactPhone: z
    .string()
    .trim()
    .max(20, "Nomor telepon maksimal 20 karakter.")
    .regex(/^[0-9+\-\s]*$/, "Nomor telepon hanya boleh angka.")
    .optional(),
});

export const memberRoles = ["GURU", "ASESOR", "TRAINER"] as const;
export const memberRoleSchema = z.enum(memberRoles);
