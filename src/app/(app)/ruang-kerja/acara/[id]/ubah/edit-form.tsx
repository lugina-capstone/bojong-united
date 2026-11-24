"use client";

import { LockIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { SectionCard } from "@/app/(app)/_components/section-card";
import { editPublishedEventAction } from "@/app/(app)/ruang-kerja/acara/actions";
import { wibIso } from "@/app/(app)/ruang-kerja/acara/_wizard/event-wizard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Milestone = {
  id: string;
  order: number;
  title: string;
  dueAt: string;
  locked: boolean;
};

/** Form edit terbatas untuk acara yang sudah terbit. */
function EditEventForm({
  eventId,
  initial,
  milestones: initialMilestones,
}: {
  eventId: string;
  initial: {
    title: string;
    description: string;
    guidelines: string;
    endsAt: string;
    minEndsAt: string;
  };
  milestones: Milestone[];
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(initial);
  const [milestones, setMilestones] = React.useState(initialMilestones);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof typeof value>(key: K, next: string) {
    setValue((current) => ({ ...current, [key]: next }));
    setErrors({});
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await editPublishedEventAction(eventId, {
        title: value.title,
        description: value.description,
        guidelines: value.guidelines,
        endsAt: wibIso(value.endsAt),
        milestones: milestones
          .filter((m) => !m.locked && m.dueAt)
          .map((m) => ({ id: m.id, dueAt: wibIso(m.dueAt) })),
      });
      if (result.fieldErrors) setErrors(result.fieldErrors);
      if (result.error) return void toast.error(result.error);
      if (!result.ok) return;
      toast.success("Perubahan acara disimpan.");
      router.push("/ruang-kerja/acara");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <SectionCard title="Informasi acara">
        <div className="flex flex-col gap-5 px-4 pb-5 sm:px-5">
          <FormField
            id="edit-title"
            label="Judul acara"
            required
            error={errors.title}
          >
            <Input
              id="edit-title"
              value={value.title}
              maxLength={120}
              onChange={(e) => set("title", e.target.value)}
            />
          </FormField>
          <FormField
            id="edit-description"
            label="Studi kasus dan tujuan"
            required
            error={errors.description}
          >
            <Textarea
              id="edit-description"
              rows={5}
              value={value.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </FormField>
          <FormField
            id="edit-guidelines"
            label="Ketentuan dan arahan"
            description="Opsional."
            error={errors.guidelines}
          >
            <Textarea
              id="edit-guidelines"
              rows={4}
              value={value.guidelines}
              onChange={(e) => set("guidelines", e.target.value)}
            />
          </FormField>
          <FormField
            id="edit-ends"
            label="Tanggal selesai (WIB)"
            required
            description="Hanya bisa diperpanjang."
            error={errors.endsAt}
            className="sm:max-w-sm"
          >
            <Input
              id="edit-ends"
              type="datetime-local"
              min={value.minEndsAt}
              value={value.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
            />
          </FormField>
        </div>
      </SectionCard>

      <div id="milestone" className="scroll-mt-24">
        <SectionCard
          title="Tenggat milestone"
          description="Tenggat milestone yang belum dikumpulkan bisa diperpanjang. Peserta menerima notifikasi."
        >
          <ul className="flex flex-col divide-y divide-border px-4 pb-2 sm:px-5">
            {milestones.map((milestone, index) => (
              <li
                key={milestone.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-small-strong text-primary-600">
                    {milestone.order}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-body-medium text-foreground">
                      {milestone.title}
                    </span>
                    {milestone.locked && (
                      <Badge tone="neutral" className="w-fit">
                        <LockIcon aria-hidden="true" />
                        Sudah dikumpulkan
                      </Badge>
                    )}
                  </div>
                </div>
                <FormField
                  id={`edit-due-${milestone.id}`}
                  label={
                    <span className="sr-only">Tenggat {milestone.title}</span>
                  }
                  error={errors[`milestones.${index}.dueAt`]}
                  className="sm:w-64"
                >
                  <Input
                    id={`edit-due-${milestone.id}`}
                    type="datetime-local"
                    disabled={milestone.locked}
                    min={initialMilestones[index]?.dueAt}
                    max={value.endsAt}
                    value={milestone.dueAt}
                    onChange={(e) => {
                      const dueAt = e.target.value;
                      setMilestones((current) =>
                        current.map((m) =>
                          m.id === milestone.id ? { ...m, dueAt } : m,
                        ),
                      );
                      setErrors({});
                    }}
                  />
                </FormField>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/ruang-kerja/acara"
          className={buttonVariants({ variant: "secondary" })}
        >
          Batal
        </Link>
        <Button type="submit" disabled={pending}>
          <SaveIcon aria-hidden="true" />
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}

export { EditEventForm };
