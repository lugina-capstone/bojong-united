"use client";

import * as React from "react";
import { toast } from "sonner";

import type { WizardRubric } from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import {
  emptyRubric,
  RubricForm,
  type RubricFormValue,
} from "@/app/(app)/ruang-kerja/rubrik/_components/rubric-form";
import { createRubricAction } from "@/app/(app)/ruang-kerja/rubrik/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Modal Buat Rubrik dari wizard acara. */
function RubricDialog({
  open,
  onOpenChange,
  fields,
  defaultFieldId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: { id: string; name: string }[];
  defaultFieldId?: string;
  onCreated: (rubric: WizardRubric) => void;
}) {
  const [value, setValue] = React.useState<RubricFormValue>(() =>
    emptyRubric(defaultFieldId),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createRubricAction(value);
      setErrors(result.fieldErrors ?? {});
      if (!result.ok || !result.rubricId) {
        toast.error(result.error ?? "Rubrik gagal disimpan.");
        return;
      }
      onCreated({
        id: result.rubricId,
        title: value.title.trim(),
        description: value.description.trim() || null,
        fieldId: value.fieldId,
        fieldName: fields.find((f) => f.id === value.fieldId)?.name ?? "",
        version: 1,
        criteria: value.criteria.map((c) => ({
          name: c.name.trim(),
          description: c.description.trim() || null,
          levels: [c.level1, c.level2, c.level3, c.level4, c.level5],
        })),
      });
      toast.success("Rubrik dibuat.");
      setValue(emptyRubric(defaultFieldId));
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Buat rubrik</DialogTitle>
            <DialogDescription>
              Setiap kriteria dinilai 1–5. Nilai milestone = total skor ÷ skor
              maksimum × 100.
            </DialogDescription>
          </DialogHeader>
          <RubricForm
            idPrefix="new-rubric"
            value={value}
            onChange={setValue}
            fields={fields}
            errors={errors}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              Simpan rubrik
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { RubricDialog };
