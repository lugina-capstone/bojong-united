"use client";

import { PencilIcon } from "lucide-react";
import Link from "next/link";

import { SectionCard } from "@/app/(app)/_components/section-card";
import type {
  MaterialWizardData,
  WizardSection,
} from "@/app/(app)/ruang-kerja/materi/_wizard/load";
import type { Errors } from "@/app/(app)/ruang-kerja/materi/_wizard/material-wizard";
import { kindOf } from "@/app/(app)/ruang-kerja/materi/_wizard/step-content";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MaterialCard } from "@/components/ui/material-card";
import {
  formatDuration,
  materialLevelLabels,
  sectionKindLabels,
} from "@/lib/material-rules";
import { cn } from "@/lib/utils";

type Data = NonNullable<MaterialWizardData>;

const VISIBILITY = [
  {
    value: "PUBLIC" as const,
    label: "Publik",
    hint: "Tampil di Jelajah › Materi. Semua peserta dapat enroll.",
  },
  {
    value: "EVENT_ONLY" as const,
    label: "Hanya lewat acara",
    hint: "Tidak tampil di Jelajah. Enroll dari acara terlampir.",
  },
];

/** Langkah 3: visibilitas, lampirkan ke acara, dan ringkasan sebelum terbit. */
function StepReview({
  data,
  info,
  categories,
  sections,
  value,
  onChange,
  errors,
}: {
  data: Data;
  info: Data["info"];
  categories: { id: string; name: string }[];
  sections: WizardSection[];
  value: Data["publish"];
  onChange: (value: Data["publish"]) => void;
  errors: Errors;
}) {
  const category =
    categories.find((c) => c.id === info.categoryId)?.name ?? "Kategori";
  const minutes = sections.reduce((s, x) => s + (x.durationMinutes ?? 0), 0);
  const edit = (step: number) =>
    data.materialId && (
      <Link
        href={`/ruang-kerja/materi/${data.materialId}/edit?step=${step}`}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <PencilIcon aria-hidden="true" />
        Ubah
      </Link>
    );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <SectionCard
          title="Visibilitas materi"
          description="Siapa yang dapat menemukan dan enroll materi ini."
          bodyClassName="gap-5 px-4 pb-5 sm:px-5"
        >
          <div
            role="radiogroup"
            aria-label="Visibilitas materi"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {VISIBILITY.map((v) => {
              const checked = value.visibility === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onChange({ ...value, visibility: v.value })}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 text-left focus-visible:shadow-focus-ring focus-visible:outline-none",
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
                      {v.label}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {v.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-small-strong text-foreground">
              Lampirkan ke acara{" "}
              {value.visibility === "PUBLIC" ? "(opsional)" : ""}
            </h3>
            <p className="text-caption text-muted-foreground">
              Pilih acara Guru/Asesor di organisasi Anda. Materi tampil sebagai
              &quot;Materi pendukung&quot; tanpa memengaruhi milestone dan nilai
              acara.
            </p>
            {errors.eventIds && (
              <p className="text-small text-danger-700">{errors.eventIds}</p>
            )}
            {data.events.length === 0 ? (
              <p className="text-small text-muted-foreground">
                Belum ada acara aktif di organisasi Anda.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.events.map((e) => {
                  const checked = value.eventIds.includes(e.id);
                  return (
                    <li key={e.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5",
                          checked
                            ? "border-primary-200 bg-primary-50"
                            : "border-border bg-card",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) =>
                            onChange({
                              ...value,
                              eventIds: next
                                ? [...value.eventIds, e.id]
                                : value.eventIds.filter((id) => id !== e.id),
                            })
                          }
                          aria-label={`Lampirkan ke ${e.title}`}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-small-strong text-foreground">
                            {e.title}
                          </span>
                          <span className="text-caption text-muted-foreground">
                            {e.creatorName} · {e.participants} peserta
                            {e.draft ? " · Draf" : ""}
                          </span>
                        </span>
                        {e.creatorRole && (
                          <Badge size="sm" tone="neutral">
                            {e.creatorRole}
                          </Badge>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SectionCard>
        <SectionCard
          title="Bagian materi"
          action={edit(2)}
          bodyClassName="gap-2 px-4 pb-5 sm:px-5"
        >
          <ol className="flex flex-col divide-y divide-border">
            {sections.map((s, i) => (
              <li
                key={s.key}
                className="flex justify-between gap-3 py-2 text-small"
              >
                <span className="text-foreground">
                  {i + 1}. {s.title}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {sectionKindLabels[kindOf(s)]}
                  {s.durationMinutes ? ` · ${s.durationMinutes} menit` : ""}
                </span>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-small-strong text-label">
              Pratinjau di Jelajah
            </h2>
            {edit(1)}
          </div>
          <MaterialCard
            title={info.title}
            category={category}
            description={info.description}
            organization={data.organization.name}
            organizationLogo={data.organization.logoUrl}
            sections={sections.length}
            duration={formatDuration(minutes)}
            learners={data.learners}
            status="not-started"
            cover={info.coverColor}
            className="sm:max-w-none"
          />
        </div>
        <SectionCard title="Ringkasan" bodyClassName="px-4 pb-5 sm:px-5">
          <dl className="flex flex-col gap-2 text-small">
            {[
              [
                "Konten",
                `${sections.length} bagian · ${formatDuration(minutes)}`,
              ],
              ["Tingkat", materialLevelLabels[info.level]],
              ["Penilaian", "Tidak ada"],
              ["Sertifikat", "Tidak ada — tercatat di Riwayat belajar"],
              ["Lampiran acara", `${value.eventIds.length} acara`],
            ].map(([label, text]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-label">{label}</dt>
                <dd className="text-right text-small-strong text-foreground">
                  {text}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      </aside>
    </div>
  );
}

export { StepReview };
