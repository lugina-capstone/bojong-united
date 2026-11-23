import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

/** Masa berlaku URL upload dan download (detik). */
const URL_EXPIRES_IN = 5 * 60;

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  // Checksum otomatis SDK membuat presigned PUT dari browser gagal dan tidak didukung semua penyedia S3.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

/** URL PUT sementara. Tipe dan ukuran ikut ditandatangani, jadi browser wajib mengirim nilai yang sama. */
export function createUploadUrl(input: {
  key: string;
  contentType: string;
  size: number;
}) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.size,
    }),
    { expiresIn: URL_EXPIRES_IN },
  );
}

/** URL GET sementara. Panggil hanya setelah izin user dicek. */
export function createDownloadUrl(key: string, fileName: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ResponseContentDisposition: contentDisposition(fileName),
    }),
    { expiresIn: URL_EXPIRES_IN },
  );
}

/** Ukuran dan tipe objek di bucket, atau null jika belum ada. */
export async function getObjectInfo(key: string) {
  try {
    const object = await s3.send(
      new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    );
    return { size: object.ContentLength, contentType: object.ContentType };
  } catch (error) {
    if (
      error instanceof S3ServiceException &&
      error.$metadata.httpStatusCode === 404
    ) {
      return null;
    }
    throw error;
  }
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
