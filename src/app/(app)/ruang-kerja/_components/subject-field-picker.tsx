"use client";

import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  createSubjectFieldAction,
  deleteSubjectFieldAction,
  renameSubjectFieldAction,
} from "@/app/(app)/ruang-kerja/subject-field-actions";
import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChipGroup } from "@/components/ui/choice-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import type { SubjectFieldOption } from "@/lib/subject-fields";

/** Chip pilihan bidang dengan "+ Bidang lain" dan "Kelola bidang" untuk bidang milik organisasi. */
function SubjectFieldPicker({
  id,
  label,
  value,
  onChange,
  fields,
  onFieldsChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (fieldId: string) => void;
  fields: SubjectFieldOption[];
  onFieldsChange: (fields: SubjectFieldOption[]) => void;
}) {
  const [newField, setNewField] = React.useState<string | null>(null);
  const [managing, setManaging] = React.useState(false);
  const [editing, setEditing] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const customFields = fields.filter((field) => field.custom);

  function addField() {
    if (!newField) return;
    startTransition(async () => {
      const result = await createSubjectFieldAction(newField);
      if (!result.ok || !result.fieldId) {
        toast.error(result.error ?? "Bidang gagal ditambahkan.");
        return;
      }
      if (!fields.some((f) => f.id === result.fieldId))
        onFieldsChange([
          ...fields,
          {
            id: result.fieldId,
            name: result.name ?? newField.trim(),
            custom: true,
          },
        ]);
      onChange(result.fieldId);
      setNewField(null);
    });
  }

  function renameField() {
    if (!editing) return;
    startTransition(async () => {
      const result = await renameSubjectFieldAction(editing.id, editing.name);
      if (!result.ok) {
        toast.error(result.error ?? "Nama bidang gagal diubah.");
        return;
      }
      onFieldsChange(
        fields.map((f) =>
          f.id === editing.id ? { ...f, name: result.name ?? f.name } : f,
        ),
      );
      setEditing(null);
      toast.success("Nama bidang diubah.");
    });
  }

  function deleteField(field: SubjectFieldOption) {
    startTransition(async () => {
      const result = await deleteSubjectFieldAction(field.id);
      if (!result.ok) {
        toast.error(result.error ?? "Bidang gagal dihapus.");
        return;
      }
      onFieldsChange(fields.filter((f) => f.id !== field.id));
      if (value === field.id) onChange("");
      toast.success(`Bidang ${field.name} dihapus.`);
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
        {customFields.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setManaging(true)}
          >
            <PencilIcon aria-hidden="true" />
            Kelola bidang
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
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
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
      <Dialog
        open={managing}
        onOpenChange={(open) => {
          setManaging(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kelola bidang</DialogTitle>
            <DialogDescription>
              Bidang tambahan milik organisasi Anda. Bidang yang sudah dipakai
              acara atau rubrik tidak dapat dihapus, dan namanya hanya dapat
              diubah Admin Organisasi.
            </DialogDescription>
          </DialogHeader>
          {customFields.length === 0 ? (
            <p className="text-body text-muted-foreground">
              Belum ada bidang tambahan.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {customFields.map((field) =>
                editing?.id === field.id ? (
                  <li key={field.id} className="flex items-center gap-2 py-2">
                    <Input
                      autoFocus
                      aria-label={`Nama baru untuk ${field.name}`}
                      value={editing.name}
                      maxLength={40}
                      onChange={(e) =>
                        setEditing({ id: field.id, name: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          renameField();
                        }
                      }}
                    />
                    <IconButton
                      type="button"
                      label="Simpan nama"
                      disabled={pending}
                      onClick={renameField}
                    >
                      <CheckIcon aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      type="button"
                      label="Batal ubah nama"
                      onClick={() => setEditing(null)}
                    >
                      <XIcon aria-hidden="true" />
                    </IconButton>
                  </li>
                ) : (
                  <li key={field.id} className="flex items-center gap-2 py-2">
                    <span className="min-w-0 flex-1 truncate text-body">
                      {field.name}
                    </span>
                    <IconButton
                      type="button"
                      label={`Ubah nama ${field.name}`}
                      disabled={pending}
                      onClick={() =>
                        setEditing({ id: field.id, name: field.name })
                      }
                    >
                      <PencilIcon aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      type="button"
                      label={`Hapus ${field.name}`}
                      disabled={pending}
                      onClick={() => deleteField(field)}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </IconButton>
                  </li>
                ),
              )}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { SubjectFieldPicker };
