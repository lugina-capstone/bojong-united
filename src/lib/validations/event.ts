import { isWebUrl, WEB_URL_ERROR } from "@/lib/web-url";
import { z } from "zod";

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, { error: `${label} minimal ${min} karakter` })
    .max(max, { error: `${label} maksimal ${max} karakter` });

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} maksimal ${max} karakter` })
    .optional()
    .transform((value) => value || null);

const date = (label: string) =>
  z.coerce
    .date({ error: `${label} wajib diisi` })
    .refine((value) => !Number.isNaN(value.getTime()), {
      error: `${label} tidak valid`,
    });

export const submissionFormats = ["PDF", "IMAGE", "TEXT", "LINK"] as const;

export const formatLabels: Record<(typeof submissionFormats)[number], string> =
  {
    PDF: "PDF",
    IMAGE: "Gambar",
    TEXT: "Teks",
    LINK: "Tautan",
  };

export const eventInfoSchema = z
  .object({
    title: text(3, 120, "Judul acara"),
    fieldId: z.string().min(1, { error: "Pilih bidang acara" }),
    description: text(20, 3000, "Studi kasus dan tujuan"),
    guidelines: optionalText(3000, "Ketentuan dan arahan"),
    startsAt: date("Tanggal mulai"),
    endsAt: date("Tanggal selesai"),
    participantType: z.enum(["INDIVIDUAL", "TEAM"]),
    maxTeamMembers: z.coerce
      .number()
      .int()
      .min(2)
      .max(10)
      .nullable()
      .optional(),
    materialIds: z.array(z.string()).max(10).default([]),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    error: "Tanggal selesai harus setelah tanggal mulai",
    path: ["endsAt"],
  })
  .refine(
    (value) => value.participantType === "INDIVIDUAL" || !!value.maxTeamMembers,
    {
      error: "Isi maksimal anggota tim (2–10)",
      path: ["maxTeamMembers"],
    },
  );

export type EventInfoInput = z.input<typeof eventInfoSchema>;

export const milestoneSchema = z.object({
  id: z.string().optional(),
  title: text(3, 120, "Judul milestone"),
  instructions: optionalText(3000, "Instruksi"),
  formats: z
    .array(z.enum(submissionFormats))
    .min(1, { error: "Pilih minimal satu format" }),
  dueAt: date("Tenggat milestone"),
  attachmentFileIds: z.array(z.string()).max(5).default([]),
});

export const milestonesSchema = z
  .array(milestoneSchema)
  .min(1, { error: "Tambahkan minimal satu milestone" })
  .max(10, { error: "Maksimal 10 milestone" });

export type MilestoneInput = z.input<typeof milestoneSchema>;

export const rubricAssignmentSchema = z
  .array(z.object({ milestoneId: z.string(), rubricId: z.string().nullable() }))
  .min(1);

export const certificateSchema = z
  .object({
    kkm: z.coerce
      .number({ error: "Ambang nilai wajib diisi" })
      .int()
      .min(0, { error: "Ambang nilai 0–100" })
      .max(100, { error: "Ambang nilai 0–100" }),
    certificateEnabled: z.boolean(),
    certificateTemplateId: z.string().nullable().optional(),
    certificateTitle: optionalText(120, "Nama sertifikat"),
    certificateIssuer: optionalText(120, "Penyelenggara"),
    certificateSigner: optionalText(120, "Penanggung jawab"),
  })
  .refine((value) => !value.certificateEnabled || !!value.certificateTitle, {
    error: "Nama sertifikat wajib diisi",
    path: ["certificateTitle"],
  })
  .refine((value) => !value.certificateEnabled || !!value.certificateIssuer, {
    error: "Penyelenggara wajib diisi",
    path: ["certificateIssuer"],
  });

export type CertificateInput = z.input<typeof certificateSchema>;

export const rubricCriterionSchema = z.object({
  name: text(2, 80, "Nama kriteria"),
  description: optionalText(300, "Deskripsi kriteria"),
  level1: text(2, 300, "Deskripsi skor 1"),
  level2: text(2, 300, "Deskripsi skor 2"),
  level3: text(2, 300, "Deskripsi skor 3"),
  level4: text(2, 300, "Deskripsi skor 4"),
  level5: text(2, 300, "Deskripsi skor 5"),
});

export const rubricSchema = z.object({
  title: text(3, 120, "Nama rubrik"),
  fieldId: z.string().min(1, { error: "Pilih bidang rubrik" }),
  description: optionalText(300, "Deskripsi"),
  criteria: z
    .array(rubricCriterionSchema)
    .min(1, { error: "Tambahkan minimal satu kriteria" })
    .max(10, { error: "Maksimal 10 kriteria" }),
});

export type RubricInput = z.input<typeof rubricSchema>;

export const editEventSchema = z.object({
  title: text(3, 120, "Judul acara"),
  description: text(20, 3000, "Studi kasus dan tujuan"),
  guidelines: optionalText(3000, "Ketentuan dan arahan"),
  endsAt: date("Tanggal selesai"),
  milestones: z
    .array(z.object({ id: z.string(), dueAt: date("Tenggat") }))
    .max(10)
    .default([]),
});

export const gradeSchema = z.object({
  scores: z
    .array(
      z.object({
        criterionId: z.string(),
        score: z.number().int().min(1).max(5),
      }),
    )
    .min(1),
  feedback: optionalText(2000, "Umpan balik"),
});

export const revisionSchema = z.object({
  note: text(10, 2000, "Catatan revisi"),
});

export const submissionSchema = z.object({
  fileId: z.string().nullable().optional(),
  link: z
    .string()
    .trim()
    .url({ error: "Tautan tidak valid" })
    .max(500)
    .refine(isWebUrl, { error: WEB_URL_ERROR })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  text: optionalText(5000, "Teks jawaban"),
});

export const fieldNameSchema = text(2, 40, "Nama bidang");
