import { z } from "zod";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Tipe file yang boleh diupload beserta ekstensinya. File di atas 10 MB memakai link (YouTube/Drive). */
export const allowedFileTypes = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "docx",
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    "pptx",
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/msword": ["doc"],
  "application/vnd.ms-powerpoint": ["ppt"],
  "video/mp4": ["mp4"],
} as const satisfies Record<string, readonly string[]>;

export type AllowedFileType = keyof typeof allowedFileTypes;

const contentTypes = Object.keys(allowedFileTypes) as [
  AllowedFileType,
  ...AllowedFileType[],
];

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export const uploadRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "Nama file wajib diisi" })
      .max(255, { error: "Nama file maksimal 255 karakter" }),
    contentType: z.enum(contentTypes, {
      error:
        "Tipe file tidak didukung. Gunakan PDF, JPG, PNG, DOC/DOCX, PPT/PPTX, XLSX, atau MP4",
    }),
    size: z
      .number()
      .int()
      .positive({ error: "File kosong" })
      .max(MAX_FILE_SIZE, { error: "Ukuran file maksimal 10 MB" }),
  })
  .refine(
    ({ name, contentType }) =>
      (allowedFileTypes[contentType] as readonly string[]).includes(
        extensionOf(name),
      ),
    { error: "Ekstensi file tidak sesuai dengan tipenya", path: ["name"] },
  );

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
