"use client";

import { CloudUploadIcon, RotateCcwIcon, SendIcon, XIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { submitMilestoneAction } from "@/app/(app)/acara/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileItem } from "@/components/ui/file-item";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadItem } from "@/components/ui/upload-item";
import { formatFileSize } from "@/lib/format";
import { uploadFile, type UploadedFile } from "@/lib/upload-client";
import { MAX_FILE_SIZE } from "@/lib/validations/file";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; name: string; size: number }
  | { status: "failed"; file: File; error: string }
  | { status: "done"; file: UploadedFile };

const ACCEPT: Record<string, string> = {
  PDF: "application/pdf,.pdf",
  IMAGE: "image/png,image/jpeg,.png,.jpg,.jpeg",
};

export function SubmissionForm({
  milestoneId,
  order,
  formats,
  revision,
}: {
  milestoneId: string;
  order: number;
  formats: string[];
  revision: boolean;
}) {
  const fileFormats = formats.filter((f) => f in ACCEPT);
  const acceptsFile = fileFormats.length > 0;
  const [upload, setUpload] = React.useState<UploadState>({ status: "idle" });
  const [text, setText] = React.useState("");
  const [link, setLink] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [confirm, setConfirm] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  async function handleFile(file: File) {
    setErrors((e) => ({ ...e, file: "" }));
    if (file.size > MAX_FILE_SIZE) {
      setUpload({
        status: "failed",
        file,
        error: "Ukuran berkas melebihi 10 MB.",
      });
      return;
    }
    setUpload({ status: "uploading", name: file.name, size: file.size });
    const uploaded = await uploadFile(file);
    setUpload(
      uploaded
        ? { status: "done", file: uploaded }
        : {
            status: "failed",
            file,
            error: "Unggahan gagal. Periksa koneksi lalu coba lagi.",
          },
    );
  }

  function validate() {
    const next: Record<string, string> = {};
    const fileId = upload.status === "done" ? upload.file.id : null;
    if (!fileId && !text.trim() && !link.trim())
      next.form = "Lampirkan berkas, tautan, atau teks jawaban.";
    if (link.trim() && !/^https?:\/\/\S+$/.test(link.trim()))
      next.link = "Tautan tidak valid. Awali dengan https://";
    if (upload.status === "uploading") next.form = "Tunggu unggahan selesai.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    startTransition(async () => {
      const result = await submitMilestoneAction(milestoneId, {
        fileId: upload.status === "done" ? upload.file.id : undefined,
        link: link.trim() || undefined,
        text: text.trim() || undefined,
      });
      setConfirm(false);
      if (result.ok) {
        toast.success(
          revision
            ? "Revisi berhasil dikirim."
            : `Milestone ${order} dikumpulkan.`,
        );
        return;
      }
      setErrors({ ...result.fieldErrors, form: result.error ?? "" });
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-foreground">
          {revision
            ? "Perbarui pekerjaan, lalu kirim ulang"
            : "Siapkan hasil pekerjaan Anda"}
        </h2>
        <p className="text-small text-muted-foreground">
          {revision
            ? "Unggah versi terbaru dan jelaskan perubahan yang sudah Anda lakukan. Versi sebelumnya tetap tersimpan di riwayat."
            : "Lampirkan hasil pekerjaan sesuai format milestone sebelum mengumpulkan."}
        </p>
      </div>

      {acceptsFile && (
        <div className="flex flex-col gap-2">
          <p className="text-small-strong text-foreground">Berkas tugas</p>
          {upload.status === "idle" && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
              data-dragging={dragging || undefined}
              className="border-border-strong flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-8 text-center transition-colors outline-none hover:bg-primary-50 focus-visible:shadow-focus-ring data-dragging:border-primary-500 data-dragging:bg-primary-50"
            >
              <CloudUploadIcon
                aria-hidden="true"
                className="size-6 text-primary-500"
              />
              <span className="text-small-strong text-primary-600">
                Tarik berkas ke sini atau pilih berkas
              </span>
              <span className="text-caption text-muted-foreground">
                {fileFormats.join(" / ").replace("IMAGE", "PNG/JPG")} · Maks. 10
                MB
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            hidden
            data-testid="submission-file"
            accept={fileFormats.map((f) => ACCEPT[f]).join(",")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleFile(file);
            }}
          />
          {upload.status === "uploading" && (
            <UploadItem name={upload.name} size={upload.size} progress={60} />
          )}
          {upload.status === "failed" && (
            <UploadItem
              name={upload.file.name}
              size={upload.file.size}
              progress={0}
              error={upload.error}
              action={
                <div className="flex gap-1">
                  {upload.file.size <= MAX_FILE_SIZE && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleFile(upload.file)}
                    >
                      <RotateCcwIcon aria-hidden="true" />
                      Unggah ulang
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Hapus berkas"
                    onClick={() => setUpload({ status: "idle" })}
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </div>
              }
            />
          )}
          {upload.status === "done" && (
            <FileItem
              name={upload.file.name}
              meta={`${formatFileSize(upload.file.size)} · Berkas siap dilampirkan`}
              kind={
                upload.file.contentType.startsWith("image/") ? "image" : "file"
              }
              action={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Hapus berkas"
                  onClick={() => setUpload({ status: "idle" })}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              }
            />
          )}
          {errors.file && (
            <p className="text-caption text-danger-600">{errors.file}</p>
          )}
        </div>
      )}

      {formats.includes("LINK") && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="submission-link"
            className="text-small-strong text-foreground"
          >
            Tautan karya
          </label>
          <Input
            id="submission-link"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            aria-invalid={Boolean(errors.link) || undefined}
          />
          {errors.link && (
            <p className="text-caption text-danger-600">{errors.link}</p>
          )}
        </div>
      )}

      {formats.includes("TEXT") && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="submission-text"
            className="text-small-strong text-foreground"
          >
            Teks jawaban
          </label>
          <Textarea
            id="submission-text"
            rows={6}
            maxLength={5000}
            placeholder="Tulis jawaban atau keterangan hasil pekerjaan Anda..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={Boolean(errors.text) || undefined}
          />
          {errors.text && (
            <p className="text-caption text-danger-600">{errors.text}</p>
          )}
        </div>
      )}

      {errors.form && (
        <p role="alert" className="text-small text-danger-600">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          size="lg"
          disabled={pending || upload.status === "uploading"}
          onClick={() => validate() && setConfirm(true)}
        >
          {revision ? "Kirim revisi" : `Kumpulkan milestone ${order}`}
          <SendIcon aria-hidden="true" />
        </Button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revision ? "Kirim revisi?" : `Kumpulkan milestone ${order}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pengumpulan tidak dapat diubah setelah dikirim. Pastikan berkas
              dan jawaban sudah benar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Periksa lagi
            </AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={submit}>
              {pending ? "Mengirim..." : "Ya, kirim"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
