export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  contentType: string;
};

export type UploadResult =
  | { file: UploadedFile }
  /** `invalid`: isi berkas tidak cocok dengan jenisnya; `failed`: gangguan jaringan atau server. */
  | { file: null; reason: "invalid" | "failed" };

export const INVALID_FILE_MESSAGE =
  "Isi berkas tidak sesuai dengan jenisnya. Pilih berkas lain.";

/** Upload berkas ke storage privat lewat URL sementara (/api/files); membedakan berkas yang ditolak dari gangguan unggah. */
export async function uploadFileWithReason(file: File): Promise<UploadResult> {
  const failed = { file: null, reason: "failed" } as const;
  try {
    const response = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });
    if (!response.ok) return failed;
    const { file: created, upload } = (await response.json()) as {
      file: UploadedFile;
      upload: { url: string; headers: Record<string, string> };
    };
    const put = await fetch(upload.url, {
      method: "PUT",
      headers: upload.headers,
      body: file,
    });
    if (!put.ok) return failed;
    const complete = await fetch(`/api/files/${created.id}/complete`, {
      method: "POST",
    });
    if (complete.ok) return { file: created };
    return complete.status === 400 ? { file: null, reason: "invalid" } : failed;
  } catch {
    return failed;
  }
}
