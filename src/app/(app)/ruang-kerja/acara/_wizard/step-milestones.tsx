"use client";

import {
  CalendarDaysIcon,
  CopyIcon,
  PaperclipIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";

import type { Errors } from "@/app/(app)/ruang-kerja/acara/_wizard/event-wizard";
import type { WizardMilestone } from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileFormatOption } from "@/components/ui/file-format-option";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadItem } from "@/components/ui/upload-item";
import { formatDateTime, parseWibInput } from "@/lib/format";
import {
  INVALID_FILE_MESSAGE,
  uploadFileWithReason,
} from "@/lib/upload-client";
import { cn } from "@/lib/utils";
import { formatLabels, submissionFormats } from "@/lib/validations/event";
import { allowedFileTypes, MAX_FILE_SIZE } from "@/lib/validations/file";

const MAX_MILESTONES = 10;

function emptyMilestone(): WizardMilestone {
  return {
    title: "",
    instructions: "",
    formats: ["PDF", "LINK"],
    dueAt: "",
    rubricId: null,
    attachments: [],
  };
}

/** Langkah 2: milestone berurutan dengan format, tenggat, dan lampiran. */
function StepMilestones({
  value,
  onChange,
  errors,
  period,
}: {
  value: WizardMilestone[];
  onChange: (value: WizardMilestone[]) => void;
  errors: Errors;
  period: { startsAt: string; endsAt: string };
}) {
  const list = value.length > 0 ? value : [emptyMilestone()];
  const [active, setActive] = React.useState(0);
  const [upload, setUpload] = React.useState<{
    name: string;
    size: number;
    error?: string;
  } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const index = Math.min(active, list.length - 1);
  const current = list[index]!;
  const err = (key: string) => errors[`${index}.${key}`];

  React.useEffect(() => {
    if (value.length === 0) onChange([emptyMilestone()]);
  }, [value.length, onChange]);

  function update(patch: Partial<WizardMilestone>) {
    onChange(list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function add(copyFrom?: WizardMilestone) {
    if (list.length >= MAX_MILESTONES) return;
    const next = copyFrom
      ? { ...copyFrom, id: undefined, title: `${copyFrom.title} (salinan)` }
      : emptyMilestone();
    onChange([...list, next]);
    setActive(list.length);
  }

  function remove() {
    if (list.length === 1) return onChange([emptyMilestone()]);
    onChange(list.filter((_, i) => i !== index));
    setActive(Math.max(0, index - 1));
  }

  async function attach(file: File | undefined) {
    if (!file) return;
    const types = allowedFileTypes as Record<string, readonly string[]>;
    if (!types[file.type]) {
      setUpload({
        name: file.name,
        size: file.size,
        error:
          "Format tidak didukung. Gunakan PDF, JPG, PNG, DOCX, PPTX, atau XLSX.",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUpload({
        name: file.name,
        size: file.size,
        error: "Ukuran berkas melebihi 10 MB.",
      });
      return;
    }
    setUpload({ name: file.name, size: file.size });
    const result = await uploadFileWithReason(file);
    const uploaded = result.file;
    if (!uploaded) {
      setUpload({
        name: file.name,
        size: file.size,
        error:
          result.reason === "invalid"
            ? INVALID_FILE_MESSAGE
            : "Unggahan gagal. Coba lagi.",
      });
      return;
    }
    setUpload(null);
    update({
      attachments: [
        ...current.attachments,
        { id: uploaded.id, name: uploaded.name, size: uploaded.size },
      ],
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 text-foreground">Daftar milestone</h2>
          <span className="text-caption text-muted-foreground">
            {list.length}/{MAX_MILESTONES}
          </span>
        </div>
        <ol className="flex flex-col gap-2">
          {list.map((milestone, i) => {
            const hasError = Object.keys(errors).some((k) =>
              k.startsWith(`${i}.`),
            );
            return (
              <li key={milestone.id ?? `new-${i}`}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={i === index ? "step" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring",
                    i === index
                      ? "border-primary-500 bg-primary-50"
                      : "border-border",
                    hasError && "border-danger-500",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-caption-strong text-inverse">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small-strong text-foreground">
                      {milestone.title || "Milestone tanpa judul"}
                    </span>
                    <span className="flex items-center gap-1 text-caption text-muted-foreground">
                      <CalendarDaysIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                      {milestone.dueAt
                        ? `Tenggat ${formatDateTime(parseWibInput(milestone.dueAt))}`
                        : "Tenggat belum diatur"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <Button
          type="button"
          variant="secondary"
          disabled={list.length >= MAX_MILESTONES}
          onClick={() => add()}
        >
          <PlusIcon aria-hidden="true" />
          Tambah milestone
        </Button>
        <Alert tone="info">
          Milestone dibuka berurutan. Peserta membuka milestone berikutnya
          setelah mengumpulkan tugas dan mengisi survei.
        </Alert>
      </section>

      <section className="flex min-w-0 flex-col gap-5 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-overline text-primary-500">
              Milestone {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="text-h3 break-words text-foreground">
              {current.title || "Milestone tanpa judul"}
            </h2>
          </div>
          <div className="flex gap-1">
            <IconButton
              label="Duplikat milestone"
              disabled={list.length >= MAX_MILESTONES}
              onClick={() => add(current)}
            >
              <CopyIcon aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Hapus milestone"
              className="text-danger-500"
              onClick={remove}
            >
              <Trash2Icon aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <FormField
          id="ms-title"
          label="Judul milestone"
          required
          error={err("title")}
        >
          <Input
            id="ms-title"
            value={current.title}
            maxLength={120}
            placeholder="Contoh: Riset pengguna"
            onChange={(e) => update({ title: e.target.value })}
            aria-invalid={Boolean(err("title"))}
          />
        </FormField>
        <FormField
          id="ms-instructions"
          label="Instruksi"
          error={err("instructions")}
        >
          <Textarea
            id="ms-instructions"
            rows={5}
            maxLength={3000}
            value={current.instructions}
            placeholder="Jelaskan apa yang harus dikumpulkan peserta."
            onChange={(e) => update({ instructions: e.target.value })}
          />
        </FormField>
        <FormField
          id="ms-formats"
          label="Format pengumpulan"
          required
          error={err("formats")}
        >
          <div
            id="ms-formats"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {submissionFormats.map((format) => (
              <FileFormatOption
                key={format}
                checked={current.formats.includes(format)}
                onCheckedChange={(checked) =>
                  update({
                    formats: checked
                      ? [...current.formats, format]
                      : current.formats.filter((f) => f !== format),
                  })
                }
              >
                {formatLabels[format]}
              </FileFormatOption>
            ))}
          </div>
        </FormField>
        <FormField
          id="ms-due"
          label="Tenggat (WIB)"
          required
          description="Harus berada dalam periode acara."
          error={err("dueAt")}
        >
          <Input
            id="ms-due"
            type="datetime-local"
            className="sm:max-w-72"
            value={current.dueAt}
            min={period.startsAt || undefined}
            max={period.endsAt || undefined}
            onChange={(e) => update({ dueAt: e.target.value })}
            aria-invalid={Boolean(err("dueAt"))}
          />
        </FormField>
        <FormField
          id="ms-files"
          label="Materi / berkas tugas"
          description="Opsional. PDF, gambar, atau dokumen Office, maks. 10 MB per berkas."
        >
          <div className="flex flex-col gap-2">
            {current.attachments.map((file) => (
              <UploadItem
                key={file.id}
                icon={PaperclipIcon}
                name={file.name}
                size={file.size}
                progress={100}
                action={
                  <IconButton
                    label={`Hapus ${file.name}`}
                    size="icon-sm"
                    onClick={() =>
                      update({
                        attachments: current.attachments.filter(
                          (a) => a.id !== file.id,
                        ),
                      })
                    }
                  >
                    <Trash2Icon aria-hidden="true" />
                  </IconButton>
                }
              />
            ))}
            {upload && (
              <UploadItem
                name={upload.name}
                size={upload.size}
                progress={upload.error ? 0 : 60}
                error={upload.error}
              />
            )}
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              tabIndex={-1}
              aria-label="Unggah berkas tugas"
              accept={Object.keys(allowedFileTypes).join(",")}
              onChange={(e) => {
                void attach(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              className="w-fit"
              disabled={
                Boolean(upload && !upload.error) ||
                current.attachments.length >= 5
              }
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon aria-hidden="true" />
              Unggah berkas
            </Button>
          </div>
        </FormField>
      </section>
    </div>
  );
}

export { StepMilestones };
