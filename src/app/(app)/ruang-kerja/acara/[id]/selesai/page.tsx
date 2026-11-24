import { ArrowRightIcon, CircleCheckIcon, CompassIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireOwnEvent } from "@/lib/teacher-access";

export const metadata: Metadata = { title: "Acara diterbitkan" };

export default async function EventPublishedPage({
  params,
}: PageProps<"/ruang-kerja/acara/[id]/selesai">) {
  const { id } = await params;
  const { event } = await requireOwnEvent(id);
  if (event.status === "DRAFT") notFound();
  const milestones = await db.milestone.count({ where: { eventId: id } });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-50 text-success-600">
        <CircleCheckIcon aria-hidden="true" className="size-8" />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-overline text-primary-500">Acara diterbitkan</p>
        <h1 className="text-display break-words text-foreground">
          {event.title}
        </h1>
        <p className="text-body text-muted-foreground">
          {milestones} milestone ·{" "}
          {event.startsAt ? formatDate(event.startsAt) : "–"} –{" "}
          {event.endsAt ? formatDate(event.endsAt) : "–"}. Peserta sudah bisa
          menemukan dan mengikuti acara ini di Jelajah.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/ruang-kerja/acara"
          className={buttonVariants({ variant: "secondary" })}
        >
          <CompassIcon aria-hidden="true" />
          Ke Acara Saya
        </Link>
        <Link href={`/ruang-kerja/acara/${id}`} className={buttonVariants()}>
          Pantau progres
          <ArrowRightIcon aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
