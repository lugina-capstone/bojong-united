"use client";

import { AwardIcon, CircleCheckIcon } from "lucide-react";

import { SectionCard } from "@/app/(app)/_components/section-card";
import type { Errors } from "@/app/(app)/ruang-kerja/acara/_wizard/event-wizard";
import { SectionTitle } from "@/app/(app)/ruang-kerja/acara/_wizard/step-info";
import type { WizardData } from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";

type Certificate = WizardData["certificate"];

/** Langkah 4: ambang kelulusan (KKM) dan rincian sertifikat. */
function StepCertificate({
  data,
  title,
  value,
  onChange,
  errors,
}: {
  data: WizardData;
  title: string;
  value: Certificate;
  onChange: (value: Certificate) => void;
  errors: Errors;
}) {
  const set = <K extends keyof Certificate>(key: K, next: Certificate[K]) =>
    onChange({ ...value, [key]: next });
  const templates = data.templates.map((t) => ({ value: t.id, label: t.name }));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <SectionCard
          title={<SectionTitle number="01" title="Syarat penerbitan" />}
          description="Nilai akhir = rata-rata nilai semua milestone."
          bodyClassName="gap-4 px-4 pb-5 sm:px-5"
        >
          <FormField
            id="cert-kkm"
            label="Ambang nilai kelulusan (0–100)"
            required
            description="Peserta dengan nilai akhir sama atau di atas ambang ini dinyatakan lulus."
            error={errors.kkm}
          >
            <Input
              id="cert-kkm"
              type="number"
              min={0}
              max={100}
              className="text-h2 sm:max-w-40"
              value={Number.isNaN(value.kkm) ? "" : value.kkm}
              onChange={(e) => set("kkm", e.target.valueAsNumber)}
              aria-invalid={Boolean(errors.kkm)}
            />
          </FormField>
        </SectionCard>

        <SectionCard
          title={<SectionTitle number="02" title="Rincian sertifikat" />}
          bodyClassName="gap-4 px-4 pb-5 sm:px-5"
        >
          <label className="flex items-start gap-3 rounded-lg border border-border p-3.5">
            <Checkbox
              checked={value.certificateEnabled}
              onCheckedChange={(checked) => set("certificateEnabled", checked)}
            />
            <span>
              <span className="block text-small-strong text-foreground">
                Terbitkan sertifikat otomatis
              </span>
              <span className="text-caption text-muted-foreground">
                Sertifikat bernomor terbit setelah semua milestone dinilai dan
                nilai akhir mencapai ambang.
              </span>
            </span>
          </label>
          {value.certificateEnabled && (
            <>
              {templates.length > 0 && (
                <FormField id="cert-template" label="Templat">
                  <Select
                    items={templates}
                    value={value.certificateTemplateId ?? ""}
                    onValueChange={(next) =>
                      set("certificateTemplateId", String(next ?? "") || null)
                    }
                  >
                    <SelectTrigger id="cert-template" className="w-full">
                      <SelectValue placeholder="Pilih templat" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
              <FormField
                id="cert-title"
                label="Nama sertifikat"
                required
                error={errors.certificateTitle}
              >
                <Input
                  id="cert-title"
                  value={value.certificateTitle}
                  maxLength={120}
                  onChange={(e) => set("certificateTitle", e.target.value)}
                  aria-invalid={Boolean(errors.certificateTitle)}
                />
              </FormField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  id="cert-issuer"
                  label="Penyelenggara"
                  required
                  error={errors.certificateIssuer}
                >
                  <Input
                    id="cert-issuer"
                    value={value.certificateIssuer}
                    maxLength={120}
                    onChange={(e) => set("certificateIssuer", e.target.value)}
                    aria-invalid={Boolean(errors.certificateIssuer)}
                  />
                </FormField>
                <FormField
                  id="cert-signer"
                  label="Penanggung jawab"
                  error={errors.certificateSigner}
                >
                  <Input
                    id="cert-signer"
                    value={value.certificateSigner}
                    maxLength={120}
                    onChange={(e) => set("certificateSigner", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  id="cert-event"
                  label="Judul acara"
                  description="Otomatis"
                >
                  <Input id="cert-event" value={title} disabled readOnly />
                </FormField>
                <FormField
                  id="cert-date"
                  label="Tanggal terbit"
                  description="Otomatis"
                >
                  <Input
                    id="cert-date"
                    value="Saat sertifikat terbit"
                    disabled
                    readOnly
                  />
                </FormField>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <div className="flex flex-col items-center gap-2 rounded-2xl border-4 border-double border-primary-200 bg-card p-6 text-center shadow-xs">
          <AwardIcon aria-hidden="true" className="size-8 text-primary-500" />
          <p className="text-overline text-primary-500">
            {value.certificateEnabled
              ? value.certificateTitle || "Sertifikat"
              : "Tanpa sertifikat"}
          </p>
          <p className="text-caption text-muted-foreground">Diberikan kepada</p>
          <p className="text-h3 text-foreground">Nama Peserta</p>
          <p className="text-small text-muted-foreground">
            atas penyelesaian{" "}
            <span className="text-small-strong">{title || "acara"}</span>
          </p>
          <p className="text-caption text-subtle">
            {value.certificateIssuer || data.organization.name} ·{" "}
            {formatDate(new Date())}
          </p>
        </div>
        <ul className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-small shadow-xs">
          {[
            "Semua milestone dikumpulkan",
            "Survei setiap milestone diisi",
            "Semua milestone sudah dinilai",
            `Nilai akhir ≥ ${Number.isNaN(value.kkm) ? "–" : value.kkm}`,
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-foreground">
              <CircleCheckIcon
                aria-hidden="true"
                className="size-4 text-success-600"
              />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export { StepCertificate };
