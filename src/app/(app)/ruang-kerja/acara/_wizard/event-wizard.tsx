"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  RocketIcon,
  SaveIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  publishEventAction,
  saveCertificateAction,
  saveEventInfoAction,
  saveMilestonesAction,
  saveRubricAssignmentsAction,
  type EventActionState,
} from "@/app/(app)/ruang-kerja/acara/actions";
import type { WizardData } from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { StepCertificate } from "@/app/(app)/ruang-kerja/acara/_wizard/step-certificate";
import { StepInfo } from "@/app/(app)/ruang-kerja/acara/_wizard/step-info";
import { StepMilestones } from "@/app/(app)/ruang-kerja/acara/_wizard/step-milestones";
import { StepReview } from "@/app/(app)/ruang-kerja/acara/_wizard/step-review";
import { StepRubrics } from "@/app/(app)/ruang-kerja/acara/_wizard/step-rubrics";
import { Button, buttonVariants } from "@/components/ui/button";
import { EVENT_STEPS, Stepper } from "@/components/ui/stepper";
import { WizardActionBar } from "@/components/ui/wizard-action-bar";

const HEADINGS = [
  {
    title: "Buat acara",
    description: "Ceritakan tantangan yang akan dikerjakan peserta.",
  },
  {
    title: "Susun milestone pembelajaran",
    description:
      "Bagi acara menjadi tahapan berurutan dengan tenggat yang jelas.",
  },
  {
    title: "Tentukan standar penilaian",
    description: "Pilih rubrik skala 1–5 untuk setiap milestone.",
  },
  {
    title: "Apresiasi setiap pencapaian",
    description:
      "Atur ambang kelulusan dan sertifikat untuk peserta yang lulus.",
  },
  {
    title: "Satu langkah sebelum dimulai",
    description: "Periksa kembali acara Anda sebelum diterbitkan ke Jelajah.",
  },
];

const NEXT_LABEL = [
  "Lanjut ke milestone",
  "Lanjut ke rubrik",
  "Lanjut ke sertifikat",
  "Lanjut ke tinjau",
];

/** Kirim nilai `datetime-local` sebagai waktu WIB. */
export function wibIso(value: string) {
  return value ? `${value}:00+07:00` : "";
}

export type Errors = Record<string, string>;

/** Wizard Buat Acara 5 langkah (PRD-03). Setiap langkah disimpan ke draf sebelum pindah. */
function EventWizard({ data, step }: { data: WizardData; step: number }) {
  const router = useRouter();
  const [info, setInfo] = React.useState(data.info);
  const [milestones, setMilestones] = React.useState(data.milestones);
  const [certificate, setCertificate] = React.useState(data.certificate);
  const [rubrics, setRubrics] = React.useState(data.rubrics);
  const [fields, setFields] = React.useState(data.fields);
  const [errors, setErrors] = React.useState<Errors>({});
  const [pending, startTransition] = React.useTransition();
  const heading = HEADINGS[step - 1]!;

  function hrefFor(eventId: string, target: number) {
    return `/ruang-kerja/acara/${eventId}/edit?step=${target}`;
  }

  async function saveCurrent(): Promise<EventActionState> {
    const eventId = data.eventId;
    if (step === 1) {
      return saveEventInfoAction(eventId, {
        ...info,
        startsAt: wibIso(info.startsAt),
        endsAt: wibIso(info.endsAt),
        maxTeamMembers:
          info.participantType === "TEAM" ? info.maxTeamMembers : null,
      });
    }
    if (!eventId) return { error: "Simpan informasi acara terlebih dahulu." };
    if (step === 2) {
      return saveMilestonesAction(
        eventId,
        milestones.map((m) => ({
          id: m.id,
          title: m.title,
          instructions: m.instructions,
          formats: m.formats,
          dueAt: wibIso(m.dueAt),
          attachmentFileIds: m.attachments.map((a) => a.id),
        })),
      );
    }
    if (step === 3) {
      return saveRubricAssignmentsAction(
        eventId,
        milestones.map((m) => ({ milestoneId: m.id!, rubricId: m.rubricId })),
      );
    }
    if (step === 4) return saveCertificateAction(eventId, certificate);
    return { ok: true, eventId };
  }

  function run(target: "draft" | "next") {
    startTransition(async () => {
      const result = await saveCurrent();
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.error ?? "Periksa kembali isian yang ditandai.");
        return;
      }
      const eventId = result.eventId ?? data.eventId!;
      if (target === "draft") {
        toast.success("Draf tersimpan. Anda bisa melanjutkannya kapan saja.");
        if (!data.eventId) router.replace(hrefFor(eventId, step));
        else router.refresh();
        return;
      }
      router.push(hrefFor(eventId, step + 1));
    });
  }

  function publish() {
    if (!data.eventId) return;
    startTransition(async () => {
      const result = await publishEventAction(data.eventId!);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="-mx-4 -mb-6 flex min-h-full flex-col sm:-mx-8 lg:-mx-12 lg:-mb-8">
      <div className="flex flex-1 flex-col gap-6 px-4 pb-8 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-1">
          <p className="text-overline text-primary-500">
            {info.title.trim() ? info.title : "Mulai perjalanan belajar baru"}
          </p>
          <h1 className="text-h1 text-foreground">{heading.title}</h1>
          <p className="text-body text-muted-foreground">
            {heading.description}
          </p>
        </header>
        <Stepper steps={EVENT_STEPS} current={step} />
        {step === 1 && (
          <StepInfo
            data={data}
            value={info}
            onChange={setInfo}
            fields={fields}
            onFieldCreated={(field) => setFields((list) => [...list, field])}
            errors={errors}
          />
        )}
        {step === 2 && (
          <StepMilestones
            value={milestones}
            onChange={setMilestones}
            errors={errors}
            period={{ startsAt: info.startsAt, endsAt: info.endsAt }}
          />
        )}
        {step === 3 && (
          <StepRubrics
            milestones={milestones}
            onChange={setMilestones}
            rubrics={rubrics}
            onRubricCreated={(rubric) =>
              setRubrics((list) => [rubric, ...list])
            }
            fields={fields}
            errors={errors}
          />
        )}
        {step === 4 && (
          <StepCertificate
            data={data}
            title={info.title}
            value={certificate}
            onChange={setCertificate}
            errors={errors}
          />
        )}
        {step === 5 && <StepReview data={data} rubrics={rubrics} />}
      </div>
      <WizardActionBar
        step={step}
        total={5}
        back={
          step > 1 && data.eventId ? (
            <Link
              href={hrefFor(data.eventId, step - 1)}
              className={buttonVariants({ variant: "ghost" })}
            >
              <ArrowLeftIcon aria-hidden="true" />
              Kembali
            </Link>
          ) : (
            <Link
              href="/ruang-kerja/acara"
              className={buttonVariants({ variant: "ghost" })}
            >
              <ArrowLeftIcon aria-hidden="true" />
              Batal
            </Link>
          )
        }
      >
        {step < 5 && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => run("draft")}
          >
            <SaveIcon aria-hidden="true" />
            Simpan draf
          </Button>
        )}
        {step < 5 ? (
          <Button disabled={pending} onClick={() => run("next")}>
            {NEXT_LABEL[step - 1]}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button
            disabled={pending || data.issues.length > 0}
            onClick={publish}
          >
            <RocketIcon aria-hidden="true" />
            Terbitkan acara
          </Button>
        )}
      </WizardActionBar>
    </div>
  );
}

export { EventWizard };
