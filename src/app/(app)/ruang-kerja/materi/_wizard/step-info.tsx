"use client";

import { CheckIcon, CircleCheckIcon, CircleXIcon } from "lucide-react";

import { SectionCard } from "@/app/(app)/_components/section-card";
import type { MaterialWizardData } from "@/app/(app)/ruang-kerja/materi/_wizard/load";
import type { Errors } from "@/app/(app)/ruang-kerja/materi/_wizard/material-wizard";
import { ChoiceChip, ChoiceChipGroup } from "@/components/ui/choice-chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { MaterialCard } from "@/components/ui/material-card";
import { Textarea } from "@/components/ui/textarea";
import { COVER_CLASS } from "@/lib/event-cover";
import {
  MATERIAL_COVERS,
  materialLevelHints,
  materialLevelLabels,
} from "@/lib/material-rules";
import { cn } from "@/lib/utils";

type Data = NonNullable<MaterialWizardData>;
type Info = Data["info"];
const OTHER = "__lainnya";

const DIFFERENCES: [boolean, string][] = [
  [false, "Tanpa milestone dan tenggat"],
  [false, "Tanpa pengumpulan tugas dan nilai"],
  [false, "Tanpa sertifikat — tercatat di Riwayat belajar"],
  [true, "Peserta enroll sendiri, belajar mandiri"],
  [true, "Bisa mandiri atau dilampirkan ke acara Guru/Asesor"],
];

/** Langkah 1: informasi materi, kategori (termasuk Lainnya), tingkat, dan sampul. */
function StepInfo({
  data,
  categories,
  value,
  onChange,
  sectionCount,
  errors,
}: {
  data: Data;
  categories: { id: string; name: string }[];
  value: Info;
  onChange: (value: Info) => void;
  sectionCount: number;
  errors: Errors;
}) {
  const set = <K extends keyof Info>(key: K, next: Info[K]) =>
    onChange({ ...value, [key]: next });
  const other = value.categoryId === "";
  const categoryName = other
    ? value.newCategory || "Kategori baru"
    : (categories.find((c) => c.id === value.categoryId)?.name ?? "");

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <SectionCard
        title="Informasi materi"
        description="Tampil di kartu Jelajah dan halaman detail materi."
        bodyClassName="gap-5 px-4 pb-5 sm:px-5"
      >
        <FormField
          id="material-title"
          label="Judul materi"
          required
          error={errors.title}
        >
          <Input
            id="material-title"
            value={value.title}
            maxLength={120}
            placeholder="Contoh: Dasar UI/UX untuk Pemula"
            onChange={(e) => set("title", e.target.value)}
            aria-invalid={Boolean(errors.title)}
          />
        </FormField>
        <FormField
          id="material-description"
          label="Deskripsi singkat"
          required
          error={errors.description}
        >
          <Textarea
            id="material-description"
            value={value.description}
            maxLength={500}
            rows={3}
            placeholder="Apa yang akan dipelajari peserta dari materi ini?"
            onChange={(e) => set("description", e.target.value)}
            aria-invalid={Boolean(errors.description)}
          />
        </FormField>
        <FormField
          id="material-outcomes"
          label="Yang akan dipelajari"
          description="Opsional. Satu poin per baris, maksimal 6 poin."
          error={errors.outcomes}
        >
          <Textarea
            id="material-outcomes"
            value={value.outcomes}
            maxLength={800}
            rows={4}
            placeholder={
              "Menyusun hierarki visual\nMemilih warna & kontras yang aksesibel"
            }
            onChange={(e) => set("outcomes", e.target.value)}
            aria-invalid={Boolean(errors.outcomes)}
          />
        </FormField>
        <FormField
          id="material-category"
          label="Kategori bidang"
          required
          error={errors.categoryId}
        >
          <ChoiceChipGroup
            id="material-category"
            value={[other ? OTHER : value.categoryId]}
            onValueChange={(next) => {
              const picked = next[0] ? String(next[0]) : null;
              if (picked === null) return;
              onChange({
                ...value,
                categoryId: picked === OTHER ? "" : picked,
              });
            }}
            aria-label="Kategori bidang"
          >
            {categories.map((c) => (
              <ChoiceChip key={c.id} value={c.id}>
                {c.name}
              </ChoiceChip>
            ))}
            <ChoiceChip value={OTHER}>Lainnya</ChoiceChip>
          </ChoiceChipGroup>
        </FormField>
        {other && (
          <FormField
            id="material-new-category"
            label="Nama kategori"
            required
            description="Kategori baru tersimpan di organisasi dan bisa dipilih Trainer lain."
            error={errors.newCategory}
          >
            <Input
              id="material-new-category"
              autoFocus
              value={value.newCategory}
              maxLength={40}
              placeholder="Contoh: Fotografi Produk"
              onChange={(e) => set("newCategory", e.target.value)}
              aria-invalid={Boolean(errors.newCategory)}
            />
          </FormField>
        )}
        <FormField id="material-level" label="Tingkat" required>
          <div
            id="material-level"
            role="radiogroup"
            aria-label="Tingkat"
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            {(
              Object.keys(
                materialLevelLabels,
              ) as (keyof typeof materialLevelLabels)[]
            ).map((level) => {
              const checked = value.level === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => set("level", level)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none",
                    checked
                      ? "border-primary-500 bg-primary-50"
                      : "border-border bg-card hover:border-primary-200",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                      checked ? "border-primary-500" : "border-input",
                    )}
                  >
                    {checked && (
                      <span className="size-2.25 rounded-full bg-primary-500" />
                    )}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-small-strong text-foreground">
                      {materialLevelLabels[level]}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {materialLevelHints[level]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </FormField>
        <FormField
          id="material-cover"
          label="Warna sampul"
          description="Sampul memakai warna yang sama di kartu Jelajah dan detail materi."
        >
          <div
            id="material-cover"
            role="radiogroup"
            aria-label="Warna sampul"
            className="flex flex-wrap gap-2"
          >
            {MATERIAL_COVERS.map((tone) => {
              const checked = value.coverColor === tone;
              return (
                <button
                  key={tone}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`Sampul ${tone}`}
                  onClick={() => set("coverColor", tone)}
                  className={cn(
                    "flex h-10 w-12 items-center justify-center rounded-lg border-2 focus-visible:shadow-focus-ring focus-visible:outline-none",
                    COVER_CLASS[tone],
                    checked ? "border-primary-500" : "border-transparent",
                  )}
                >
                  {checked && (
                    <CheckIcon aria-hidden="true" className="size-4" />
                  )}
                </button>
              );
            })}
          </div>
        </FormField>
      </SectionCard>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <section className="flex flex-col gap-3 rounded-2xl bg-primary-50 p-5">
          <h2 className="text-h3 text-foreground">Apa bedanya dengan acara?</h2>
          <ul className="flex flex-col gap-2 text-small text-label">
            {DIFFERENCES.map(([yes, label]) => (
              <li key={label} className="flex gap-2">
                {yes ? (
                  <CircleCheckIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-success-600"
                  />
                ) : (
                  <CircleXIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-subtle"
                  />
                )}
                {label}
              </li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-2">
          <h2 className="text-small-strong text-label">Pratinjau kartu</h2>
          <MaterialCard
            title={value.title.trim() || "Judul materi"}
            category={categoryName}
            description={
              value.description.trim() || "Deskripsi singkat materi."
            }
            organization={data.organization.name}
            organizationLogo={data.organization.logoUrl}
            sections={sectionCount}
            duration={materialLevelLabels[value.level]}
            learners={data.learners}
            status="not-started"
            cover={value.coverColor}
            className="sm:max-w-none"
          />
        </div>
      </aside>
    </div>
  );
}

export { StepInfo };
