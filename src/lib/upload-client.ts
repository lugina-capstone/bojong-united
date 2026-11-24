export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  contentType: string;
};

/** Upload berkas ke storage privat lewat URL sementara (/api/files). Null jika gagal. */
export async function uploadFile(file: File): Promise<UploadedFile | null> {
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
    if (!response.ok) return null;
    const { file: created, upload } = (await response.json()) as {
      file: UploadedFile;
      upload: { url: string; headers: Record<string, string> };
    };
    const put = await fetch(upload.url, {
      method: "PUT",
      headers: upload.headers,
      body: file,
    });
    if (!put.ok) return null;
    const complete = await fetch(`/api/files/${created.id}/complete`, {
      method: "POST",
    });
    return complete.ok ? created : null;
  } catch {
    return null;
  }
}
