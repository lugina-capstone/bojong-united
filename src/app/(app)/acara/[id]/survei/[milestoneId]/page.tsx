import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SurveyForm } from "@/app/(app)/acara/[id]/survei/[milestoneId]/_components/survey-form";
import { requireParticipant } from "@/lib/participant-access";
import { loadWorkspace } from "@/lib/participant-workspace";

export const metadata: Metadata = { title: "Survei milestone" };

export default async function SurveyPage({
  params,
}: PageProps<"/acara/[id]/survei/[milestoneId]">) {
  const user = await requireParticipant();
  const { id, milestoneId } = await params;
  const ws = await loadWorkspace(id, user.id);
  const milestone = ws.milestones.find((m) => m.id === milestoneId);
  if (!milestone?.survey) notFound();
  if (!milestone.latest || milestone.surveyDone || ws.readOnly)
    redirect(`/acara/${id}?m=${milestone.order}`);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href={`/acara/${id}`} className="hover:text-foreground">
          {ws.event.title}
        </Link>{" "}
        / Milestone {milestone.order} / Kuesioner
      </nav>
      <header className="flex flex-col gap-1.5">
        <p className="text-overline text-primary-600">Survei pembelajaran</p>
        <h1 className="text-display text-foreground">
          Bagaimana pengalaman belajar Anda?
        </h1>
        <p className="text-small text-muted-foreground">
          Milestone {milestone.order} · {milestone.title} / {ws.event.title}
        </p>
      </header>
      <SurveyForm
        milestoneId={milestone.id}
        milestoneOrder={milestone.order}
        eventId={id}
        questions={milestone.survey.questions}
        hasNext={milestone.index < ws.milestones.length - 1}
      />
    </div>
  );
}
