import { z } from "zod";

import { MATERIAL_COVERS } from "@/lib/material-rules";

const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { error: `${label} minimal ${min} karakter` })
    .max(max, { error: `${label} maksimal ${max} karakter` });

export const materialInfoSchema = z
  .object({
    title: text("Judul materi", 3, 120),
    description: text("Deskripsi singkat", 10, 500),
    categoryId: z.string().default(""),
    newCategory: z.string().trim().max(40).default(""),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
      error: "Pilih tingkat",
    }),
    coverColor: z.enum(MATERIAL_COVERS, { error: "Pilih warna sampul" }),
  })
  .superRefine((value, ctx) => {
    if (value.categoryId) return;
    if (value.newCategory.length >= 3) return;
    ctx.addIssue({
      code: "custom",
      path: ["newCategory"],
      message: "Nama kategori wajib diisi (minimal 3 karakter)",
    });
  });

export const materialSectionSchema = z
  .object({
    id: z.string().optional(),
    mode: z.enum(["text", "file", "link"]).optional(),
    title: text("Judul bagian", 3, 120),
    content: z.string().trim().max(10000).default(""),
    fileId: z.string().nullable().default(null),
    link: z
      .union([z.literal(""), z.url({ error: "Tautan tidak valid" })])
      .default(""),
    durationMinutes: z
      .number({ error: "Durasi harus berupa angka" })
      .int()
      .min(1, { error: "Durasi minimal 1 menit" })
      .max(600, { error: "Durasi maksimal 600 menit" })
      .nullable()
      .default(null),
  })
  .refine((s) => Boolean(s.content || s.fileId || s.link), {
    path: ["content"],
    error: "Isi bagian dengan teks bacaan, berkas, atau tautan",
  })
  .refine((s) => s.mode !== "file" || Boolean(s.fileId), {
    path: ["content"],
    error: "Unggah berkas untuk bagian ini",
  })
  .refine((s) => s.mode !== "link" || Boolean(s.link), {
    path: ["link"],
    error: "Isi tautan untuk bagian ini",
  });

export const materialSectionsSchema = z
  .array(materialSectionSchema)
  .min(1, { error: "Tambahkan minimal satu bagian" })
  .max(30, { error: "Maksimal 30 bagian" });

export const materialPublishSchema = z
  .object({
    visibility: z.enum(["PUBLIC", "EVENT_ONLY"]),
    eventIds: z.array(z.string()).max(20),
  })
  .refine((v) => v.visibility === "PUBLIC" || v.eventIds.length > 0, {
    path: ["eventIds"],
    error: "Pilih minimal satu acara untuk materi yang hanya lewat acara",
  });

export type MaterialInfoInput = z.input<typeof materialInfoSchema>;
export type MaterialSectionInput = z.input<typeof materialSectionSchema>;
