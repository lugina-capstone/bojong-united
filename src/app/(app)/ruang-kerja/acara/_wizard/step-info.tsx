"use client";

import { UserIcon, UsersIcon } from "lucide-react";
import * as React from "react";

import { SectionCard } from "@/app/(app)/_components/section-card";
import { SubjectFieldPicker } from "@/app/(app)/ruang-kerja/_components/subject-field-picker";
import type { Errors } from "@/app/(app)/ruang-kerja/acara/_wizard/event-wizard";
import type { WizardData } from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { InfoBox } from "@/components/ui/info-box";
import { Input } from "@/components/ui/input";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, parseWibInput } from "@/lib/format";
import type { SubjectFieldOption } from "@/lib/subject-fields";

type Info = WizardData["info"];

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-overline text-primary-500">{number}</span>
      <span>{title}</span>
    </span>
  );
}

/** Langkah 1: informasi acara, periode, jenis peserta, dan materi pendukung. */
function StepInfo({
  data,
  value,
  onChange,
  fields,
  onFieldsChange,
  errors,
}: {
  data: WizardData;
  value: Info;
  onChange: (value: Info) => void;
  fields: SubjectFieldOption[];
  onFieldsChange: (fields: SubjectFieldOption[]) => void;
  errors: Errors;
}) {
  const set = <K extends keyof Info>(key: K, next: Info[K]) =>
    onChange({ ...value, [key]: next });

  const fieldName = fields.find((f) => f.id === value.fieldId)?.name;
  const period =
    value.startsAt && value.endsAt
      ? `${formatDate(parseWibInput(value.startsAt))} – ${formatDate(parseWibInput(value.endsAt))}`
      : "Periode belum diatur";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <SectionCard
          title={<SectionTitle number="01" title="Tentang acara" />}
          bodyClassName="gap-5 px-4 pb-5 sm:px-5"
        >
          <FormField
            id="event-title"
            label="Judul acara"
            required
            error={errors.title}
          >
            <Input
              id="event-title"
              value={value.title}
              maxLength={120}
              placeholder="Contoh: Redesain Aplikasi Perpustakaan Sekolah"
              onChange={(e) => set("title", e.target.value)}
              aria-invalid={Boolean(errors.title)}
            />
          </FormField>
          <FormField
            id="event-field"
            label="Bidang acara"
            required
            description="Menentukan rubrik yang disarankan. Acara tidak terbatas pada UI/UX."
            error={errors.fieldId}
          >
            <SubjectFieldPicker
              id="event-field"
              label="Bidang acara"
              value={value.fieldId}
              onChange={(fieldId) => set("fieldId", fieldId)}
              fields={fields}
              onFieldsChange={onFieldsChange}
            />
          </FormField>
          <FormField
            id="event-description"
            label="Studi kasus dan tujuan"
            required
            description="Jelaskan masalah nyata yang dipecahkan peserta dan hasil yang diharapkan."
            error={errors.description}
          >
            <Textarea
              id="event-description"
              rows={5}
              value={value.description}
              maxLength={3000}
              onChange={(e) => set("description", e.target.value)}
              aria-invalid={Boolean(errors.description)}
            />
          </FormField>
          <FormField
            id="event-guidelines"
            label="Ketentuan dan arahan"
            description="Opsional. Aturan pengerjaan, orisinalitas, atau tautan referensi."
            error={errors.guidelines}
          >
            <Textarea
              id="event-guidelines"
              rows={4}
              value={value.guidelines}
              maxLength={3000}
              onChange={(e) => set("guidelines", e.target.value)}
            />
          </FormField>
        </SectionCard>

        <SectionCard
          title={<SectionTitle number="02" title="Periode dan peserta" />}
          bodyClassName="gap-5 px-4 pb-5 sm:px-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="event-start"
              label="Mulai (WIB)"
              required
              error={errors.startsAt}
            >
              <Input
                id="event-start"
                type="datetime-local"
                value={value.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
                aria-invalid={Boolean(errors.startsAt)}
              />
            </FormField>
            <FormField
              id="event-end"
              label="Selesai (WIB)"
              required
              error={errors.endsAt}
            >
              <Input
                id="event-end"
                type="datetime-local"
                value={value.endsAt}
                min={value.startsAt || undefined}
                onChange={(e) => set("endsAt", e.target.value)}
                aria-invalid={Boolean(errors.endsAt)}
              />
            </FormField>
          </div>
          <FormField id="event-type" label="Jenis peserta" required>
            <SegmentedControl
              id="event-type"
              value={[value.participantType]}
              onValueChange={(next) =>
                onChange({
                  ...value,
                  participantType: next[0] as Info["participantType"],
                  maxTeamMembers:
                    next[0] === "TEAM" ? (value.maxTeamMembers ?? 4) : null,
                })
              }
            >
              <SegmentedControlItem value="INDIVIDUAL">
                <UserIcon aria-hidden="true" className="mr-1.5 size-4" />
                Individu
              </SegmentedControlItem>
              <SegmentedControlItem value="TEAM">
                <UsersIcon aria-hidden="true" className="mr-1.5 size-4" />
                Tim
              </SegmentedControlItem>
            </SegmentedControl>
          </FormField>
          {value.participantType === "TEAM" && (
            <FormField
              id="event-team-max"
              label="Maksimal anggota per tim"
              required
              description="Termasuk ketua. Peserta pertama otomatis menjadi ketua tim."
              error={errors.maxTeamMembers}
            >
              <Input
                id="event-team-max"
                type="number"
                min={2}
                max={10}
                className="sm:max-w-40"
                value={value.maxTeamMembers ?? ""}
                onChange={(e) =>
                  set(
                    "maxTeamMembers",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                aria-invalid={Boolean(errors.maxTeamMembers)}
              />
            </FormField>
          )}
        </SectionCard>

        <SectionCard
          title={<SectionTitle number="03" title="Materi pendukung" />}
          description="Opsional. Pilih materi terbit di organisasi Anda untuk dibaca peserta."
          bodyClassName="gap-2 px-4 pb-5 sm:px-5"
        >
          {data.materials.length === 0 ? (
            <p className="text-small text-muted-foreground">
              Belum ada materi terbit di organisasi Anda.
            </p>
          ) : (
            data.materials.map((material) => {
              const checked = value.materialIds.includes(material.id);
              return (
                <label
                  key={material.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted has-data-checked:border-primary-300 has-data-checked:bg-primary-50"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) =>
                      set(
                        "materialIds",
                        next
                          ? [...value.materialIds, material.id]
                          : value.materialIds.filter(
                              (id) => id !== material.id,
                            ),
                      )
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small-strong text-foreground">
                      {material.name}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {material.category}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </SectionCard>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex min-h-36 flex-col justify-between gap-4 bg-primary-500 p-5 text-inverse">
            <div className="flex items-center justify-between gap-2">
              <span className="text-overline opacity-80">
                {fieldName ?? "Bidang"}
              </span>
              <Badge tone="neutral">Draf</Badge>
            </div>
            <p className="text-h3 break-words">
              {value.title || "Judul acara Anda"}
            </p>
          </div>
          <div className="flex flex-col gap-1 p-4">
            <p className="text-small-strong text-foreground">
              {data.creatorName} · {data.creatorRole}
            </p>
            <p className="text-caption text-muted-foreground">{period}</p>
            <p className="text-caption text-muted-foreground">
              {value.participantType === "TEAM"
                ? `Acara tim · maks ${value.maxTeamMembers ?? "–"} anggota`
                : "Pendaftaran mandiri"}
            </p>
          </div>
        </div>
        <InfoBox
          title="Tips menyusun acara"
          items={[
            {
              title: "Studi kasus nyata",
              description:
                "Masalah yang dekat dengan kehidupan peserta membuat karya lebih bermakna.",
            },
            {
              title: "Periode realistis",
              description:
                "Sisakan waktu untuk revisi sebelum tanggal selesai.",
            },
          ]}
        />
      </aside>
    </div>
  );
}

export { StepInfo, SectionTitle };
