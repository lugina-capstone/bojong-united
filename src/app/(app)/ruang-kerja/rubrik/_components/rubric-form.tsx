"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChipGroup } from "@/components/ui/choice-chip";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SCORE_LEVELS } from "@/components/ui/score-level";
import { Textarea } from "@/components/ui/textarea";

export type RubricFormValue = {
  title: string;
  fieldId: string;
  description: string;
  criteria: {
    name: string;
    description: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
  }[];
};

const LEVEL_KEYS = ["level1", "level2", "level3", "level4", "level5"] as const;

export function emptyCriterion(): RubricFormValue["criteria"][number] {
  return {
    name: "",
    description: "",
    level1: "Belum memenuhi",
    level2: "Kurang",
    level3: "Cukup",
    level4: "Baik",
    level5: "Sangat baik",
  };
}

export function emptyRubric(fieldId = ""): RubricFormValue {
  return { title: "", fieldId, description: "", criteria: [emptyCriterion()] };
}

/** Form rubrik skala 1–5: nama, bidang, dan kriteria dengan deskripsi tiap skor. */
function RubricForm({
  value,
  onChange,
  fields,
  errors,
  idPrefix = "rubric",
}: {
  value: RubricFormValue;
  onChange: (value: RubricFormValue) => void;
  fields: { id: string; name: string }[];
  errors: Record<string, string>;
  idPrefix?: string;
}) {
  const setCriterion = (
    index: number,
    patch: Partial<RubricFormValue["criteria"][number]>,
  ) =>
    onChange({
      ...value,
      criteria: value.criteria.map((c, i) =>
        i === index ? { ...c, ...patch } : c,
      ),
    });

  return (
    <div className="flex flex-col gap-5">
      <FormField
        id={`${idPrefix}-title`}
        label="Nama rubrik"
        required
        error={errors.title}
      >
        <Input
          id={`${idPrefix}-title`}
          value={value.title}
          maxLength={120}
          placeholder="Contoh: Rubrik Desain UI"
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          aria-invalid={Boolean(errors.title)}
        />
      </FormField>
      <FormField
        id={`${idPrefix}-field`}
        label="Bidang"
        required
        error={errors.fieldId}
      >
        <ChoiceChipGroup
          id={`${idPrefix}-field`}
          aria-label="Bidang rubrik"
          value={value.fieldId ? [value.fieldId] : []}
          onValueChange={(next) =>
            next[0] && onChange({ ...value, fieldId: String(next[0]) })
          }
        >
          {fields.map((field) => (
            <ChoiceChip key={field.id} value={field.id}>
              {field.name}
            </ChoiceChip>
          ))}
        </ChoiceChipGroup>
      </FormField>
      <FormField
        id={`${idPrefix}-description`}
        label="Deskripsi"
        error={errors.description}
      >
        <Textarea
          id={`${idPrefix}-description`}
          rows={2}
          maxLength={300}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </FormField>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-body-strong text-foreground">
            Kriteria · {value.criteria.length}
          </h3>
          <span className="text-caption text-muted-foreground">
            Skor maksimum {value.criteria.length * 5}
          </span>
        </div>
        {errors.criteria && (
          <p role="alert" className="text-caption text-danger-500">
            {errors.criteria}
          </p>
        )}
        {value.criteria.map((criterion, index) => (
          <fieldset
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border p-3.5 sm:p-4"
          >
            <div className="flex items-start gap-2">
              <legend className="sr-only">Kriteria {index + 1}</legend>
              <span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-caption-strong text-primary-600">
                {index + 1}
              </span>
              <FormField
                id={`${idPrefix}-c${index}-name`}
                label="Nama kriteria"
                required
                className="flex-1"
                error={errors[`criteria.${index}.name`]}
              >
                <Input
                  id={`${idPrefix}-c${index}-name`}
                  value={criterion.name}
                  maxLength={80}
                  placeholder="Contoh: Kerapian visual"
                  onChange={(e) =>
                    setCriterion(index, { name: e.target.value })
                  }
                  aria-invalid={Boolean(errors[`criteria.${index}.name`])}
                />
              </FormField>
              <IconButton
                label={`Hapus kriteria ${index + 1}`}
                className="mt-7 text-danger-500"
                disabled={value.criteria.length === 1}
                onClick={() =>
                  onChange({
                    ...value,
                    criteria: value.criteria.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2Icon aria-hidden="true" />
              </IconButton>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              {LEVEL_KEYS.map((key, level) => (
                <FormField
                  key={key}
                  id={`${idPrefix}-c${index}-${key}`}
                  label={`Skor ${level + 1} · ${SCORE_LEVELS[(level + 1) as 1].label}`}
                  error={errors[`criteria.${index}.${key}`]}
                >
                  <Textarea
                    id={`${idPrefix}-c${index}-${key}`}
                    rows={2}
                    maxLength={300}
                    value={criterion[key]}
                    onChange={(e) =>
                      setCriterion(index, { [key]: e.target.value })
                    }
                    aria-invalid={Boolean(errors[`criteria.${index}.${key}`])}
                  />
                </FormField>
              ))}
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="w-fit"
          disabled={value.criteria.length >= 10}
          onClick={() =>
            onChange({
              ...value,
              criteria: [...value.criteria, emptyCriterion()],
            })
          }
        >
          <PlusIcon aria-hidden="true" />
          Tambah kriteria
        </Button>
      </div>
    </div>
  );
}

export { RubricForm };
