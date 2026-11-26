"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  InfoIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
  TypeIcon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";

import { SectionCard } from "@/app/(app)/_components/section-card";
import type { WizardSection } from "@/app/(app)/ruang-kerja/materi/_wizard/load";
import type { Errors } from "@/app/(app)/ruang-kerja/materi/_wizard/material-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { UploadItem } from "@/components/ui/upload-item";
import { formatFileSize } from "@/lib/format";
import {
  formatDuration,
  sectionKind,
  sectionKindLabels,
  type SectionKind,
} from "@/lib/material-rules";
import {
  INVALID_FILE_MESSAGE,
  uploadFileWithReason,
} from "@/lib/upload-client";
import { KIND_ICON, KIND_TONE } from "@/lib/material-section-ui";
import { cn } from "@/lib/utils";
import { allowedFileTypes, MAX_FILE_SIZE } from "@/lib/validations/file";

const MAX_SECTIONS = 30;

let counter = 0;
function emptySection(): WizardSection {
  counter += 1;
  return {
    key: `baru-${Date.now()}-${counter}`,
    title: "",
    content: "",
    mode: "file",
    fileId: null,
    file: null,
    link: "",
    durationMinutes: null,
  };
}

/** Jenis bagian sesuai isian yang aktif. */
export function kindOf(s: WizardSection): SectionKind {
  if (s.mode === "file" && s.file)
    return sectionKind({ fileContentType: s.file.contentType });
  if (s.mode === "link" && s.link) return "link";
  return s.mode === "text" || (!s.file && !s.link) ? "text" : "file";
}

/** Langkah 2: susun bagian materi berisi berkas, tautan, atau teks bacaan. */
function StepContent({
  value,
  onChange,
  errors,
}: {
  value: WizardSection[];
  onChange: (value: WizardSection[]) => void;
  errors: Errors;
}) {
  const list = value.length ? value : [emptySection()];
  const [active, setActive] = React.useState(0);
  const [upload, setUpload] = React.useState<{
    name: string;
    size: number;
    error?: string;
  } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const index = Math.min(active, list.length - 1);
  const current = list[index]!;
  const err = (key: string) => errors[`${index}.${key}`];

  React.useEffect(() => {
    if (value.length === 0) onChange([emptySection()]);
  }, [value.length, onChange]);

  const listRef = React.useRef(list);
  React.useEffect(() => {
    listRef.current = list;
  });

  function update(patch: Partial<WizardSection>) {
    onChange(list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
    setActive(to);
  }

  function remove(at: number) {
    if (list.length === 1) return onChange([emptySection()]);
    onChange(list.filter((_, i) => i !== at));
    setActive(Math.max(0, at - 1));
  }

  async function attach(file: File | undefined) {
    if (!file) return;
    const key = list[index]?.key;
    const types = allowedFileTypes as Record<string, readonly string[]>;
    if (!types[file.type]) {
      setUpload({
        name: file.name,
        size: file.size,
        error: "Format tidak didukung. Gunakan PDF, PPT, DOC, atau MP4.",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUpload({
        name: file.name,
        size: file.size,
        error:
          "Ukuran berkas melebihi 10 MB. Gunakan tautan YouTube/Google Drive.",
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
            : "Unggahan gagal dan tidak tersimpan. Unggah ulang.",
      });
      return;
    }
    setUpload(null);
    onChange(
      listRef.current.map((s) =>
        s.key === key
          ? {
              ...s,
              fileId: uploaded.id,
              file: {
                name: uploaded.name,
                size: uploaded.size,
                contentType: uploaded.contentType,
              },
            }
          : s,
      ),
    );
  }

  const totalMinutes = list.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0,
  );
  const counts = list.reduce(
    (acc, s) => ({ ...acc, [kindOf(s)]: acc[kindOf(s)] + 1 }),
    { file: 0, video: 0, link: 0, text: 0 } as Record<SectionKind, number>,
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <SectionCard
          title="Bagian materi"
          description={`${list.length} bagian · total ${formatDuration(totalMinutes)}`}
          bodyClassName="gap-2 px-4 pb-5 sm:px-5"
        >
          {errors[""] && (
            <p className="text-small text-danger-700">{errors[""]}</p>
          )}
          <ol className="flex flex-col gap-2">
            {list.map((s, i) => {
              const kind = kindOf(s);
              const Icon = KIND_ICON[kind];
              const invalid = Object.keys(errors).some((k) =>
                k.startsWith(`${i}.`),
              );
              return (
                <li
                  key={s.key}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-card p-3",
                    i === index
                      ? "border-primary-500 ring-1 ring-primary-500"
                      : "border-border",
                    invalid && "border-danger-500",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-current={i === index ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        KIND_TONE[kind],
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4.5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-small-strong text-foreground">
                        {i + 1}. {s.title.trim() || "Bagian tanpa judul"}
                      </span>
                      <span className="truncate text-caption text-muted-foreground">
                        {s.mode === "file" && s.file
                          ? `${s.file.name} · ${formatFileSize(s.file.size)}`
                          : s.mode === "link" && s.link
                            ? s.link
                            : sectionKindLabels[kind]}
                        {s.durationMinutes
                          ? ` · ${s.durationMinutes} menit`
                          : ""}
                      </span>
                    </span>
                  </button>
                  <Badge
                    size="sm"
                    tone="neutral"
                    className="hidden sm:inline-flex"
                  >
                    {sectionKindLabels[kind]}
                  </Badge>
                  <div className="flex shrink-0 gap-1">
                    <IconButton
                      label={`Naikkan bagian ${i + 1}`}
                      size="icon-sm"
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                    >
                      <ArrowUpIcon aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`Turunkan bagian ${i + 1}`}
                      size="icon-sm"
                      disabled={i === list.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      <ArrowDownIcon aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`Hapus bagian ${i + 1}`}
                      size="icon-sm"
                      onClick={() => remove(i)}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button
            type="button"
            variant="secondary"
            className="w-full border-dashed"
            disabled={list.length >= MAX_SECTIONS}
            onClick={() => {
              onChange([...list, emptySection()]);
              setActive(list.length);
            }}
          >
            <PlusIcon aria-hidden="true" />
            Tambah bagian
          </Button>
        </SectionCard>
        <SectionCard
          title={`Bagian ${index + 1} · ${current.title.trim() || "Bagian baru"}`}
          description="Berkas, video, tautan, atau teks bacaan"
          bodyClassName="gap-5 px-4 pb-5 sm:px-5"
        >
          <FormField
            id="section-title"
            label="Judul bagian"
            required
            error={err("title")}
          >
            <Input
              id="section-title"
              value={current.title}
              maxLength={120}
              placeholder="Contoh: Pengantar UI/UX"
              onChange={(e) => update({ title: e.target.value })}
              aria-invalid={Boolean(err("title"))}
            />
          </FormField>
          <FormField id="section-mode" label="Jenis isi">
            <SegmentedControl
              id="section-mode"
              value={[current.mode]}
              onValueChange={(next) =>
                next[0] && update({ mode: next[0] as WizardSection["mode"] })
              }
              aria-label="Jenis isi bagian"
            >
              <SegmentedControlItem value="file">
                <UploadIcon aria-hidden="true" className="mr-1.5 size-4" />
                Berkas
              </SegmentedControlItem>
              <SegmentedControlItem value="link">
                <LinkIcon aria-hidden="true" className="mr-1.5 size-4" />
                Tautan
              </SegmentedControlItem>
              <SegmentedControlItem value="text">
                <TypeIcon aria-hidden="true" className="mr-1.5 size-4" />
                Teks bacaan
              </SegmentedControlItem>
            </SegmentedControl>
          </FormField>
          {current.mode === "file" && (
            <div className="flex flex-col gap-2">
              {current.file ? (
                <UploadItem
                  icon={KIND_ICON[kindOf(current)]}
                  name={current.file.name}
                  size={current.file.size}
                  progress={100}
                  action={
                    <IconButton
                      label={`Hapus ${current.file.name}`}
                      size="icon-sm"
                      onClick={() => update({ fileId: null, file: null })}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </IconButton>
                  }
                />
              ) : (
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
                    void attach(e.dataTransfer.files?.[0]);
                  }}
                  disabled={Boolean(upload && !upload.error)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none",
                    dragging
                      ? "border-primary-500 bg-primary-50"
                      : "border-primary-200 bg-card hover:bg-primary-50",
                  )}
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <UploadIcon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="text-small-strong text-primary-600">
                    Tarik berkas ke sini atau pilih berkas
                  </span>
                  <span className="text-caption text-muted-foreground">
                    PDF, PPT, DOC, MP4 · maks 10 MB per berkas
                  </span>
                </button>
              )}
              {upload && (
                <UploadItem
                  name={upload.name}
                  size={upload.size}
                  progress={upload.error ? 0 : 60}
                  error={upload.error}
                />
              )}
              {err("content") && !current.file && (
                <p className="text-small text-danger-700">
                  Unggah berkas, atau pilih jenis isi lain.
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                className="sr-only"
                tabIndex={-1}
                aria-label="Unggah berkas bagian"
                accept={Object.keys(allowedFileTypes).join(",")}
                onChange={(e) => {
                  void attach(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          )}
          {current.mode === "link" && (
            <FormField
              id="section-link"
              label="Tautan"
              required
              description="Untuk video atau berkas di atas 10 MB, gunakan tautan YouTube/Google Drive."
              error={err("link") ?? (current.link ? undefined : err("content"))}
            >
              <Input
                id="section-link"
                type="url"
                value={current.link}
                placeholder="https://"
                onChange={(e) => update({ link: e.target.value })}
                aria-invalid={Boolean(err("link"))}
              />
            </FormField>
          )}
          <FormField
            id="section-content"
            label={current.mode === "text" ? "Teks bacaan" : "Catatan bagian"}
            required={current.mode === "text"}
            description={
              current.mode === "text"
                ? undefined
                : "Opsional. Ringkasan atau petunjuk singkat untuk peserta."
            }
            error={current.mode === "text" ? err("content") : undefined}
          >
            <Textarea
              id="section-content"
              value={current.content}
              rows={current.mode === "text" ? 8 : 3}
              maxLength={10000}
              onChange={(e) => update({ content: e.target.value })}
              aria-invalid={current.mode === "text" && Boolean(err("content"))}
            />
          </FormField>
          <FormField
            id="section-duration"
            label="Estimasi durasi (menit)"
            error={err("durationMinutes")}
          >
            <Input
              id="section-duration"
              type="number"
              min={1}
              max={600}
              className="sm:max-w-40"
              value={current.durationMinutes ?? ""}
              onChange={(e) =>
                update({
                  durationMinutes: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            />
          </FormField>
        </SectionCard>
      </div>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <SectionCard
          title="Ringkasan konten"
          bodyClassName="gap-3 px-4 pb-5 sm:px-5"
        >
          {(Object.keys(counts) as SectionKind[]).map((kind) => {
            const Icon = KIND_ICON[kind];
            return (
              <div key={kind} className="flex items-center gap-3 text-small">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    KIND_TONE[kind],
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="flex-1 text-label">
                  {sectionKindLabels[kind]}
                </span>
                <span className="text-small-strong text-foreground">
                  {counts[kind]} bagian
                </span>
              </div>
            );
          })}
        </SectionCard>
        <section className="flex flex-col gap-2 rounded-2xl bg-primary-50 p-5 text-small text-label">
          <h2 className="text-h3 text-foreground">Ketentuan berkas</h2>
          <p>Format: PDF, PPT/PPTX, DOC/DOCX, MP4.</p>
          <p>Ukuran maks 10 MB per berkas.</p>
          <p>Lebih dari 10 MB: gunakan tautan YouTube/Google Drive.</p>
          <p className="flex gap-2">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Unggahan gagal tidak tersimpan — unggah ulang setelah diperbaiki.
          </p>
        </section>
      </aside>
    </div>
  );
}

export { StepContent };
