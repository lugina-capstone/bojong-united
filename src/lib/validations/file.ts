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

const ZIP = [0x50, 0x4b, 0x03, 0x04];
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

/** Tanda byte awal tiap tipe; `offset` untuk tanda yang tidak dimulai dari byte pertama. */
const signatures: Record<
  AllowedFileType,
  { bytes: number[]; offset?: number }
> = {
  "application/pdf": { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  "image/jpeg": { bytes: [0xff, 0xd8, 0xff] },
  "image/png": { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    bytes: ZIP,
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    bytes: ZIP,
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    bytes: ZIP,
  },
  "application/msword": { bytes: OLE },
  "application/vnd.ms-powerpoint": { bytes: OLE },
  "video/mp4": { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
};

export const FILE_SIGNATURE_LENGTH = 12;

/** Apakah byte awal berkas cocok dengan tipe yang dilaporkan saat unggah. */
export function matchesFileSignature(contentType: string, head: Uint8Array) {
  const signature = signatures[contentType as AllowedFileType];
  if (!signature) return false;
  const offset = signature.offset ?? 0;
  return signature.bytes.every((byte, i) => head[offset + i] === byte);
}
