"use client";

import { ClipboardListIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { SectionCard } from "@/app/(app)/_components/section-card";
import type { Errors } from "@/app/(app)/ruang-kerja/acara/_wizard/event-wizard";
import type {
  WizardMilestone,
  WizardOption,
  WizardRubric,
} from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { RubricDialog } from "@/app/(app)/ruang-kerja/rubrik/_components/rubric-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceChip, ChoiceChipGroup } from "@/components/ui/choice-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { RubricCriterion } from "@/components/ui/rubric";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Langkah 3: pilih rubrik (satu untuk semua milestone atau per milestone). */
function StepRubrics({
  milestones,
  onChange,
  rubrics,
  onRubricCreated,
  fields,
  errors,
}: {
  milestones: WizardMilestone[];
  onChange: (value: WizardMilestone[]) => void;
  rubrics: WizardRubric[];
  onRubricCreated: (rubric: WizardRubric) => void;
  fields: WizardOption[];
  errors: Errors;
}) {
  const ids = new Set(milestones.map((m) => m.rubricId));
  const [same, setSame] = React.useState(ids.size <= 1);
  const [query, setQuery] = React.useState("");
  const [field, setField] = React.useState("");
  const [dialog, setDialog] = React.useState(false);
  const [previewId, setPreviewId] = React.useState<string | null>(
    milestones[0]?.rubricId ?? rubrics[0]?.id ?? null,
  );
  const preview = rubrics.find((r) => r.id === previewId) ?? null;

  const filtered = rubrics.filter(
    (r) =>
      (!field || r.fieldId === field) &&
      r.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const items = rubrics.map((r) => ({ value: r.id, label: r.title }));

  function pick(rubricId: string) {
    setPreviewId(rubricId);
    if (same) onChange(milestones.map((m) => ({ ...m, rubricId })));
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <SectionCard
        title="Pilih rubrik"
        description="Rubrik organisasi Anda dengan skala 1–5."
        action={
          <Button size="sm" onClick={() => setDialog(true)}>
            <PlusIcon aria-hidden="true" />
            Buat rubrik
          </Button>
        }
        bodyClassName="gap-4 px-4 pb-5 sm:px-5"
      >
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari rubrik..."
          aria-label="Cari rubrik"
        />
        <ChoiceChipGroup
          aria-label="Filter bidang"
          value={[field]}
          onValueChange={(next) => setField(String(next[0] ?? ""))}
        >
          <ChoiceChip value="">Semua</ChoiceChip>
          {fields.map((f) => (
            <ChoiceChip key={f.id} value={f.id}>
              {f.name}
            </ChoiceChip>
          ))}
        </ChoiceChipGroup>
        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardListIcon}
            title="Rubrik tidak ditemukan"
            description="Ubah filter atau buat rubrik baru."
          />
        ) : (
          <div
            role="radiogroup"
            aria-label="Rubrik"
            className="flex flex-col gap-2"
          >
            {filtered.map((rubric) => (
              <button
                key={rubric.id}
                type="button"
                role="radio"
                aria-checked={rubric.id === previewId}
                onClick={() => pick(rubric.id)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-3.5 text-left transition-colors outline-none hover:bg-muted focus-visible:shadow-focus-ring",
                  rubric.id === previewId
                    ? "border-primary-500 bg-primary-50"
                    : "border-border bg-card",
                )}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-small-strong text-foreground">
                    {rubric.title}
                  </span>
                  {rubric.version > 1 && (
                    <span className="text-caption text-muted-foreground">
                      v{rubric.version}
                    </span>
                  )}
                </span>
                {rubric.description && (
                  <span className="line-clamp-2 text-caption text-muted-foreground">
                    {rubric.description}
                  </span>
                )}
                <span className="text-caption text-subtle">
                  {rubric.fieldName} · {rubric.criteria.length} kriteria · Skor
                  1–5
                </span>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="flex min-w-0 flex-col gap-6">
        <SectionCard
          title="Rubrik per milestone"
          bodyClassName="gap-4 px-4 pb-5 sm:px-5"
        >
          <label className="flex items-center gap-2 text-small text-foreground">
            <Checkbox
              checked={same}
              onCheckedChange={(checked) => {
                setSame(checked);
                if (checked && previewId)
                  onChange(
                    milestones.map((m) => ({ ...m, rubricId: previewId })),
                  );
              }}
            />
            Gunakan rubrik yang sama untuk semua milestone
          </label>
          <ol className="flex flex-col gap-3">
            {milestones.map((milestone, index) => (
              <li key={milestone.id ?? index} className="flex flex-col gap-1.5">
                <span className="text-caption-strong text-label">
                  M{index + 1} · {milestone.title}
                </span>
                <Select
                  items={items}
                  value={milestone.rubricId ?? ""}
                  disabled={same}
                  onValueChange={(next) => {
                    const rubricId = String(next ?? "") || null;
                    setPreviewId(rubricId);
                    onChange(
                      milestones.map((m, i) =>
                        i === index ? { ...m, rubricId } : m,
                      ),
                    );
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={`Rubrik milestone ${index + 1}`}
                    aria-invalid={Boolean(errors[milestone.id ?? ""])}
                  >
                    <SelectValue placeholder="Pilih rubrik" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[milestone.id ?? ""] && (
                  <span role="alert" className="text-caption text-danger-500">
                    Pilih rubrik untuk milestone ini
                  </span>
                )}
              </li>
            ))}
          </ol>
        </SectionCard>

        {preview && (
          <SectionCard
            title="Pratinjau rubrik"
            description={preview.title}
            bodyClassName="gap-4 px-4 pb-5 sm:px-5"
          >
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Kriteria", preview.criteria.length],
                ["Skala", "1–5"],
                ["Skor maks.", preview.criteria.length * 5],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-muted p-2.5">
                  <dt className="text-caption text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-h3 text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-3">
              {preview.criteria.map((c, i) => (
                <RubricCriterion
                  key={i}
                  order={i + 1}
                  name={c.name}
                  range="1–5"
                />
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <RubricDialog
        open={dialog}
        onOpenChange={setDialog}
        fields={fields}
        defaultFieldId={field || undefined}
        onCreated={(rubric) => {
          onRubricCreated(rubric);
          pick(rubric.id);
        }}
      />
    </div>
  );
}

export { StepRubrics };
