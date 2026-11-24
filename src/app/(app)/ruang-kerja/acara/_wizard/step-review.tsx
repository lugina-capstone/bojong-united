import { CircleAlertIcon, CircleCheckIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

import { SectionCard } from "@/app/(app)/_components/section-card";
import type {
  WizardData,
  WizardRubric,
} from "@/app/(app)/ruang-kerja/acara/_wizard/load";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { MilestoneCard } from "@/components/ui/milestone-card";
import { OrgLogo } from "@/components/ui/org-logo";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatLabels } from "@/lib/validations/event";

/** Langkah 5: tinjau seluruh isian sebelum terbit. */
function StepReview({
  data,
  rubrics,
}: {
  data: WizardData;
  rubrics: WizardRubric[];
}) {
  const info = data.info;
  const field = data.fields.find((f) => f.id === info.fieldId)?.name ?? "–";
  const edit = (step: number) => (
    <Link
      href={`/ruang-kerja/acara/${data.eventId}/edit?step=${step}`}
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      <PencilIcon aria-hidden="true" />
      Ubah
    </Link>
  );
  const rows: [string, string][] = [
    ["Judul", info.title],
    ["Bidang", field],
    [
      "Periode",
      info.startsAt && info.endsAt
        ? `${formatDate(new Date(info.startsAt))} – ${formatDate(new Date(info.endsAt))}`
        : "–",
    ],
    [
      "Jenis peserta",
      info.participantType === "TEAM"
        ? `Tim · maks ${info.maxTeamMembers} anggota`
        : "Individu",
    ],
    ["Ambang kelulusan", String(data.certificate.kkm)],
    [
      "Sertifikat",
      data.certificate.certificateEnabled
        ? data.certificate.certificateTitle
        : "Tidak aktif",
    ],
  ];
  const checks = [
    [
      "Informasi acara lengkap",
      Boolean(info.title && info.fieldId && info.startsAt),
    ],
    ["Minimal satu milestone", data.milestones.length > 0],
    [
      "Setiap milestone memakai rubrik",
      data.milestones.every((m) => m.rubricId),
    ],
    ["Survei milestone disiapkan otomatis", true],
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        {data.issues.length > 0 && (
          <Alert tone="warning" title="Acara belum bisa diterbitkan">
            <ul className="list-disc pl-4">
              {data.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Alert>
        )}
        <SectionCard
          title="Informasi acara"
          action={edit(1)}
          bodyClassName="px-4 pb-5 sm:px-5"
        >
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="text-caption text-muted-foreground">{label}</dt>
                <dd className="text-small-strong break-words text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-small whitespace-pre-line text-label">
            {info.description}
          </p>
        </SectionCard>
        <SectionCard
          title="Milestone dan survei"
          action={edit(2)}
          bodyClassName="gap-3 px-4 pb-5 sm:px-5"
        >
          {data.milestones.map((m, i) => (
            <MilestoneCard
              key={m.id ?? i}
              order={i + 1}
              title={m.title}
              description={m.instructions || undefined}
              deadline={m.dueAt ? formatDateTime(new Date(m.dueAt)) : "–"}
              formats={m.formats.map((f) => formatLabels[f])}
              hasSurvey
              status={
                <span className="text-caption text-muted-foreground">
                  Rubrik:{" "}
                  {rubrics.find((r) => r.id === m.rubricId)?.title ??
                    "belum dipilih"}
                </span>
              }
            />
          ))}
        </SectionCard>
      </div>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <SectionCard
          title="Penyelenggara"
          bodyClassName="gap-3 px-4 pb-5 sm:px-5"
        >
          <div className="flex items-center gap-3">
            <OrgLogo
              name={data.organization.name}
              src={data.organization.logoUrl}
              className="size-11 rounded-lg"
            />
            <div className="min-w-0">
              <p className="truncate text-small-strong text-foreground">
                {data.organization.name}
              </p>
              <p className="text-caption text-muted-foreground">
                {data.creatorName} · {data.creatorRole}
              </p>
            </div>
          </div>
          <p className="text-caption text-subtle">
            Setelah terbit, acara langsung tampil di Jelajah untuk semua
            peserta.
          </p>
        </SectionCard>
        <SectionCard
          title="Siap diterbitkan"
          bodyClassName="gap-2 px-4 pb-5 sm:px-5"
        >
          {checks.map(([label, ok]) => (
            <p
              key={label}
              className="flex items-center gap-2 text-small text-foreground"
            >
              {ok ? (
                <CircleCheckIcon
                  aria-hidden="true"
                  className="size-4 text-success-600"
                />
              ) : (
                <CircleAlertIcon
                  aria-hidden="true"
                  className="text-warning-600 size-4"
                />
              )}
              {label}
            </p>
          ))}
        </SectionCard>
      </aside>
    </div>
  );
}

export { StepReview };
