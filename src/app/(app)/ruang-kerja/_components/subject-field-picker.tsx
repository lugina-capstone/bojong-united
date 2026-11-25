"use client";

import { PlusIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { createSubjectFieldAction } from "@/app/(app)/ruang-kerja/acara/actions";
import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChipGroup } from "@/components/ui/choice-chip";
import { Input } from "@/components/ui/input";

type FieldOption = { id: string; name: string };

/** Chip pilihan bidang dengan "+ Bidang lain" untuk menambah bidang organisasi. */
function SubjectFieldPicker({
  id,
  label,
  value,
  onChange,
  fields,
  onFieldCreated,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (fieldId: string) => void;
  fields: FieldOption[];
  onFieldCreated: (field: FieldOption) => void;
}) {
  const [newField, setNewField] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function addField() {
    if (!newField) return;
    startTransition(async () => {
      const result = await createSubjectFieldAction(newField);
      if (!result.ok || !result.fieldId) {
        toast.error(result.error ?? "Bidang gagal ditambahkan.");
        return;
      }
      if (!fields.some((f) => f.id === result.fieldId))
        onFieldCreated({ id: result.fieldId, name: newField.trim() });
      onChange(result.fieldId);
      setNewField(null);
    });
  }

  return (
    <>
      <ChoiceChipGroup
        id={id}
        value={value ? [value] : []}
        onValueChange={(next) => next[0] && onChange(String(next[0]))}
        aria-label={label}
      >
        {fields.map((field) => (
          <ChoiceChip key={field.id} value={field.id}>
            {field.name}
          </ChoiceChip>
        ))}
        {newField === null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNewField("")}
          >
            <PlusIcon aria-hidden="true" />
            Bidang lain
          </Button>
        )}
      </ChoiceChipGroup>
      {newField !== null && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            autoFocus
            aria-label="Nama bidang baru"
            placeholder="Nama bidang, mis. Fotografi"
            value={newField}
            maxLength={40}
            onChange={(e) => setNewField(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addField();
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setNewField(null)}
            >
              Batal
            </Button>
            <Button type="button" disabled={pending} onClick={addField}>
              Tambah
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export { SubjectFieldPicker };
