"use client";

import {
  ArrowRightIcon,
  CloudUploadIcon,
  FileTextIcon,
  InfoIcon,
  LinkIcon,
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  saveSubmissionDraftAction,
  submitMilestoneAction,
} from "@/app/(app)/acara/actions";
import { Alert } from "@/components/ui/alert";
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
import { IconBox } from "@/components/ui/icon-box";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadItem } from "@/components/ui/upload-item";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { MAX_SUBMISSION_FILES } from "@/lib/submission-helpers";
import {
  INVALID_FILE_MESSAGE,
  uploadFileWithReason,
  type UploadedFile,
} from "@/lib/upload-client";
import { MAX_FILE_SIZE } from "@/lib/validations/file";

type UploadingFile = {
  key: string;
  name: string;
  size: number;
};

type FailedUpload = {
  key: string;
  file: File;
  error: string;
  retryable: boolean;
};

export type InitialSubmissionDraft = {
  files: UploadedFile[];
  link: string;
  text: string;
  revisionNote: string;
  updatedAt: string;
};

const ACCEPT: Record<string, string> = {
  PDF: "application/pdf,.pdf",
  IMAGE: "image/png,image/jpeg,.png,.jpg,.jpeg",
};

const FORMAT_MATCH: Record<string, (type: string) => boolean> = {
  PDF: (t) => t === "application/pdf",
  IMAGE: (t) => t === "image/png" || t === "image/jpeg",
};

export function SubmissionForm({
  milestoneId,
  order,
  formats,
  revision,
  eventTitle,
  milestoneTitle,
  nextVersion,
  hasSurvey = false,
  hasNextMilestone = false,
  initialDraft = null,
}: {
  milestoneId: string;
  order: number;
  formats: string[];
  revision: boolean;
  eventTitle?: string;
  milestoneTitle?: string;
  nextVersion?: number;
  hasSurvey?: boolean;
  hasNextMilestone?: boolean;
  initialDraft?: InitialSubmissionDraft | null;
}) {
  const fileFormats = formats.filter((f) => f in ACCEPT);
  const acceptsFile = fileFormats.length > 0;
  const formatHint = fileFormats.join(" / ").replace("IMAGE", "PNG/JPG");

  const [files, setFiles] = React.useState<UploadedFile[]>(
    initialDraft?.files ?? [],
  );
  const [uploading, setUploading] = React.useState<UploadingFile[]>([]);
  const [failed, setFailed] = React.useState<FailedUpload[]>([]);
  const [text, setText] = React.useState(initialDraft?.text ?? "");
  const [link, setLink] = React.useState(initialDraft?.link ?? "");
  const [revisionNote, setRevisionNote] = React.useState(
    initialDraft?.revisionNote ?? "",
  );
  const [draftSavedAt, setDraftSavedAt] = React.useState<string | null>(
    initialDraft?.updatedAt ?? null,
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [confirm, setConfirm] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const seqRef = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);

  const isUploading = uploading.length > 0;
  const remainingSlots = MAX_SUBMISSION_FILES - files.length - uploading.length;

  async function uploadSingleFile(file: File) {
    seqRef.current += 1;
    const key = `${file.name}-${file.size}-${seqRef.current}`;
    const typeOk = fileFormats.some((f) => FORMAT_MATCH[f]?.(file.type));
    const sizeOk = file.size <= MAX_FILE_SIZE;
    if (!typeOk || !sizeOk) {
      const reason =
        !typeOk && !sizeOk
          ? `format tidak didukung dan melebihi batas 10 MB. Gunakan ${formatHint}, maksimal 10 MB.`
          : !typeOk
            ? `format tidak didukung. Gunakan ${formatHint}.`
            : "ukuran berkas melebihi batas 10 MB.";
      setFailed((prev) => [
        ...prev,
        { key, file, error: reason, retryable: false },
      ]);
      return;
    }

    setUploading((prev) => [
      ...prev,
      { key, name: file.name, size: file.size },
    ]);
    const uploaded = await uploadFileWithReason(file);
    setUploading((prev) => prev.filter((item) => item.key !== key));
    if (uploaded.file) {
      setFiles((prev) =>
        prev.length < MAX_SUBMISSION_FILES ? [...prev, uploaded.file] : prev,
      );
      return;
    }
    setFailed((prev) => [
      ...prev,
      {
        key,
        file,
        error:
          uploaded.reason === "invalid"
            ? INVALID_FILE_MESSAGE
            : "Unggahan gagal. Periksa koneksi lalu coba lagi.",
        retryable: uploaded.reason !== "invalid",
      },
    ]);
  }

  function handleSelectedFiles(fileList: FileList | File[]) {
    setErrors((e) => ({ ...e, file: "" }));
    const list = Array.from(fileList);
    if (list.length === 0) return;
    if (remainingSlots <= 0) {
      setErrors((e) => ({
        ...e,
        file: `Maksimal ${MAX_SUBMISSION_FILES} berkas per pengumpulan.`,
      }));
      return;
    }
    const allowed = list.slice(0, remainingSlots);
    if (list.length > remainingSlots) {
      setErrors((e) => ({
        ...e,
        file: `Hanya ${remainingSlots} berkas tambahan yang dapat dilampirkan (maks. ${MAX_SUBMISSION_FILES} berkas).`,
      }));
    }
    for (const file of allowed) {
      void uploadSingleFile(file);
    }
  }

  function retryFailed(item: FailedUpload) {
    setFailed((prev) => prev.filter((f) => f.key !== item.key));
    void uploadSingleFile(item.file);
  }

  function validate(forDraft = false) {
    const next: Record<string, string> = {};
    if (isUploading) next.form = "Tunggu semua unggahan berkas selesai.";
    if (link.trim() && !/^https?:\/\/\S+$/.test(link.trim()))
      next.link = "Tautan harus diawali http:// atau https://";
    if (!forDraft && files.length === 0 && !text.trim() && !link.trim())
      next.form = "Lampirkan berkas, tautan, atau teks jawaban.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function saveDraft() {
    if (!validate(true)) return;
    setSavingDraft(true);
    startTransition(async () => {
      try {
        const result = await saveSubmissionDraftAction(milestoneId, {
          fileIds: files.map((f) => f.id),
          link: link.trim() || undefined,
          text: text.trim() || undefined,
          revisionNote: revision ? revisionNote.trim() || undefined : undefined,
        });
        if (result.ok) {
          setDraftSavedAt(result.savedAt ?? null);
          setErrors({});
          toast.success(
            result.savedAt ? "Draf berhasil disimpan." : "Draf dikosongkan.",
          );
          return;
        }
        setErrors({ ...result.fieldErrors, form: result.error ?? "" });
        if (result.error) toast.error(result.error);
      } finally {
        setSavingDraft(false);
      }
    });
  }

  function submit() {
    startTransition(async () => {
      const result = await submitMilestoneAction(milestoneId, {
        fileIds: files.map((f) => f.id),
        link: link.trim() || undefined,
        text: text.trim() || undefined,
        revisionNote: revision ? revisionNote.trim() || undefined : undefined,
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
    <section
      id="form-pengumpulan"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-foreground">
          {revision ? "Unggah ulang tugas" : "Siapkan hasil pekerjaan Anda"}
        </h2>
        {revision && nextVersion && (
          <p className="text-small-strong text-label">
            Milestone {order}
            {milestoneTitle ? ` · ${milestoneTitle}` : ""} / Versi {nextVersion}
          </p>
        )}
        <p className="text-small text-muted-foreground">
          {revision
            ? `Perbaiki dokumen sesuai catatan guru, lalu lampirkan berkas terbaru. Pengiriman ini akan tercatat sebagai versi ${nextVersion ?? 2}.`
            : "Lampirkan hasil pekerjaan sesuai format milestone sebelum mengumpulkan."}
        </p>
      </div>

      {draftSavedAt && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-small text-warning-700">
          <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            {revision
              ? `Draf revisi tersimpan pada ${formatDateTime(new Date(draftSavedAt))} WIB. Pilih Kirim revisi untuk mengirimkannya kepada guru.`
              : `Draf tersimpan pada ${formatDateTime(new Date(draftSavedAt))} WIB. Berkas dalam draf belum dihitung sebagai pengumpulan.`}
          </p>
        </div>
      )}

      {acceptsFile && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-small-strong text-foreground">
              {revision ? "Berkas revisi" : "Berkas tugas"}
            </p>
            <span className="text-caption text-muted-foreground">
              {files.length} / {MAX_SUBMISSION_FILES} berkas
            </span>
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <FileItem
                  key={file.id}
                  name={file.name}
                  meta={`${formatFileSize(file.size)} · Berkas siap dilampirkan`}
                  kind={
                    file.contentType.startsWith("image/") ? "image" : "file"
                  }
                  action={
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Hapus ${file.name}`}
                      onClick={() =>
                        setFiles((prev) => prev.filter((f) => f.id !== file.id))
                      }
                    >
                      {revision ? (
                        <Trash2Icon aria-hidden="true" />
                      ) : (
                        <XIcon aria-hidden="true" />
                      )}
                    </Button>
                  }
                />
              ))}
            </div>
          )}

          {uploading.map((item) => (
            <UploadItem
              key={item.key}
              name={item.name}
              size={item.size}
              progress={60}
            />
          ))}

          {remainingSlots > 0 && (
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
                handleSelectedFiles(e.dataTransfer.files);
              }}
              data-dragging={dragging || undefined}
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-8 text-center transition-colors outline-none hover:bg-primary-50 focus-visible:shadow-focus-ring data-dragging:border-primary-500 data-dragging:bg-primary-50"
            >
              <CloudUploadIcon
                aria-hidden="true"
                className="size-6 text-primary-500"
              />
              <span className="text-small-strong text-primary-600">
                Tarik berkas ke sini atau pilih berkas
              </span>
              <span className="text-caption text-muted-foreground">
                {formatHint} · Maks. 10 MB per berkas · Maks.{" "}
                {MAX_SUBMISSION_FILES} berkas
              </span>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            data-testid="submission-file"
            accept={fileFormats.map((f) => ACCEPT[f]).join(",")}
            onChange={(e) => {
              if (e.target.files) handleSelectedFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {failed.map((item) => (
            <Alert
              key={item.key}
              tone="danger"
              title="Berkas tidak dapat diunggah"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {item.file.name} ({formatFileSize(item.file.size)}):{" "}
                  {item.error}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {item.retryable && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => retryFailed(item)}
                    >
                      <RotateCcwIcon aria-hidden="true" />
                      Unggah ulang
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Tutup peringatan unggahan"
                    onClick={() =>
                      setFailed((prev) =>
                        prev.filter((f) => f.key !== item.key),
                      )
                    }
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))}

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
            rows={5}
            maxLength={5000}
            placeholder="Tulis ringkasan temuan atau keterangan hasil pekerjaan Anda..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={Boolean(errors.text) || undefined}
          />
          <p className="text-caption text-muted-foreground">
            Gunakan area ini untuk jawaban teks atau keterangan berkas yang Anda
            lampirkan.
          </p>
          {errors.text && (
            <p className="text-caption text-danger-600">{errors.text}</p>
          )}
        </div>
      )}

      {revision && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="submission-revision-note"
            className="text-small-strong text-foreground"
          >
            Catatan revisi
          </label>
          <p className="text-caption text-muted-foreground">
            Jelaskan perubahan agar guru lebih mudah memeriksa ulang tugas Anda.
          </p>
          <Textarea
            id="submission-revision-note"
            rows={4}
            maxLength={2000}
            placeholder="Jelaskan perubahan yang Anda buat sesuai arahan guru..."
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            aria-invalid={Boolean(errors.revisionNote) || undefined}
          />
          {errors.revisionNote && (
            <p className="text-caption text-danger-600">
              {errors.revisionNote}
            </p>
          )}
        </div>
      )}

      {errors.form && (
        <p role="alert" className="text-small text-danger-600">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending || isUploading}
            onClick={saveDraft}
          >
            <SaveIcon aria-hidden="true" />
            {savingDraft ? "Menyimpan..." : "Simpan draf"}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={pending || isUploading}
            onClick={() => validate(false) && setConfirm(true)}
          >
            {revision ? "Kirim revisi" : `Kumpulkan milestone ${order}`}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
        <p className="text-caption text-muted-foreground">
          {revision
            ? `Versi sebelumnya tetap tersimpan dalam riwayat. Nilai terbaru akan tersedia setelah guru memeriksa versi ${nextVersion ?? 2}.`
            : `Berkas dalam draf belum dihitung sebagai pengumpulan. Pilih Kumpulkan milestone ${order} untuk mengirim pekerjaan Anda.`}
        </p>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <IconBox icon={SendIcon} tone="primary" size="lg" />
            <AlertDialogTitle className="text-display">
              {revision
                ? `Kirim revisi milestone ${order}${nextVersion ? ` (versi ${nextVersion})` : ""}?`
                : `Kumpulkan tugas milestone ${order}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan berkas dan jawaban yang dilampirkan sudah sesuai. Tugas
              akan tercatat sebagai pengumpulan setelah Anda mengirimkannya.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 rounded-xl bg-background p-4">
            <p className="text-h3 text-label">
              {milestoneTitle ?? `Milestone ${order}`}
            </p>
            {eventTitle && (
              <p className="text-caption text-muted-foreground">{eventTitle}</p>
            )}
            {files.map((file) => (
              <p
                key={file.id}
                className="flex items-center gap-2 text-small text-muted-foreground"
              >
                <FileTextIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary-500"
                />
                <span className="truncate">
                  {file.name} · {formatFileSize(file.size)}
                </span>
              </p>
            ))}
            {link.trim() && (
              <p className="flex items-center gap-2 text-small text-muted-foreground">
                <LinkIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary-500"
                />
                <span className="truncate">{link.trim()}</span>
              </p>
            )}
            {revision && revisionNote.trim() && (
              <p className="line-clamp-2 border-t border-border pt-2 text-small text-label">
                Catatan revisi: {revisionNote.trim()}
              </p>
            )}
            {text.trim() && files.length === 0 && !link.trim() && (
              <p className="line-clamp-2 text-small text-muted-foreground">
                {text.trim()}
              </p>
            )}
          </div>

          {revision ? (
            <div className="flex flex-col gap-1 rounded-xl bg-primary-50 p-4">
              <p className="text-body-strong text-tone-navy-fg">
                Menunggu hasil pemeriksaan guru
              </p>
              <p className="text-small text-muted-foreground">
                Versi sebelumnya tetap tersimpan dalam riwayat. Nilai terbaru
                akan diperbarui setelah guru memeriksa versi revisi Anda.
              </p>
            </div>
          ) : (
            hasSurvey && (
              <div className="flex flex-col gap-1 rounded-xl bg-primary-50 p-4">
                <p className="text-body-strong text-tone-navy-fg">
                  Berikutnya: isi survei milestone {order}
                </p>
                <p className="text-small text-muted-foreground">
                  Survei terbuka setelah tugas dikumpulkan.
                  {hasNextMilestone
                    ? ` Milestone ${order + 1} terbuka setelah survei dikirim, tanpa menunggu penilaian guru.`
                    : ""}
                </p>
              </div>
            )
          )}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={pending}>
              Periksa kembali
            </AlertDialogCancel>
            <AlertDialogAction size="lg" disabled={pending} onClick={submit}>
              {pending
                ? "Mengirim..."
                : revision
                  ? "Ya, kirim revisi"
                  : "Ya, kumpulkan"}
              <ArrowRightIcon aria-hidden="true" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
