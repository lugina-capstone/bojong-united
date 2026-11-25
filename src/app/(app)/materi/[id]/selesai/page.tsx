import {
  ArrowUpRightIcon,
  CalendarIcon,
  CircleCheckIcon,
  ClockIcon,
  CompassIcon,
  HistoryIcon,
  InfoIcon,
  LayersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { MaterialCard } from "@/components/ui/material-card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";
import { visibleMaterialWhere } from "@/lib/material-access";
import { materialCardsFor } from "@/lib/material-catalog";
import { loadLearning } from "@/lib/material-learning";
import { formatDuration } from "@/lib/material-rules";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Materi selesai" };

export default async function MaterialDonePage({
  params,
}: PageProps<"/materi/[id]/selesai">) {
  const user = await requirePermission("material:enroll");
  const { id } = await params;
  const { enrollment, material } = await loadLearning(id, user.id);
  if (!enrollment.completedAt) redirect(`/materi/${id}`);
  const minutes = material.sections.reduce(
    (s, x) => s + (x.durationMinutes ?? 0),
    0,
  );
  const related = await materialCardsFor(
    user.id,
    {
      ...visibleMaterialWhere,
      visibility: "PUBLIC",
      categoryId: material.category.id,
      id: { not: id },
      enrollments: { none: { userId: user.id } },
    },
    { skip: 0, take: 3 },
  );

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/portofolio?tab=belajar" className="hover:text-foreground">
          Portofolio / Riwayat belajar
        </Link>{" "}
        / {material.title}
      </nav>
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-success-200 bg-success-50 px-5 py-8 text-center sm:px-10">
        <span className="flex size-14 items-center justify-center rounded-full bg-card text-success-600">
          <CircleCheckIcon aria-hidden="true" className="size-7" />
        </span>
        <p className="text-overline text-success-700">
          Riwayat belajar diperbarui
        </p>
        <h1 className="text-display text-foreground">Materi selesai!</h1>
        <p className="text-small text-label">
          Anda telah menyelesaikan {material.sections.length} dari{" "}
          {material.sections.length} bagian “{material.title}”.
        </p>
        <div className="flex w-full max-w-md flex-col gap-1">
          <Progress value={100} label="Progres 100%" />
          <span className="text-caption-strong text-success-700">
            Progres 100%
          </span>
        </div>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              icon: LayersIcon,
              value: `${material.sections.length} / ${material.sections.length}`,
              label: "Bagian selesai",
            },
            {
              icon: ClockIcon,
              value: formatDuration(minutes),
              label: "Waktu belajar",
            },
            {
              icon: CalendarIcon,
              value: formatDate(enrollment.completedAt),
              label: "Diselesaikan",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left"
            >
              <s.icon
                aria-hidden="true"
                className="size-5 shrink-0 text-primary-500"
              />
              <span className="flex flex-col">
                <span className="text-small-strong text-foreground">
                  {s.value}
                </span>
                <span className="text-caption text-muted-foreground">
                  {s.label}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="flex max-w-2xl items-start gap-2 rounded-xl border border-primary-200 bg-card p-3 text-left text-caption text-label">
          <InfoIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary-500"
          />
          Tanpa sertifikat. Materi tidak menerbitkan sertifikat. Riwayat ini
          tampil di Portofolio › Riwayat belajar dan bisa dibuka kembali kapan
          saja.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/jelajah?tab=materi"
            className={buttonVariants({ variant: "secondary" })}
          >
            <CompassIcon aria-hidden="true" />
            Jelajah materi lain
          </Link>
          <Link href="/portofolio?tab=belajar" className={buttonVariants()}>
            <HistoryIcon aria-hidden="true" />
            Lihat riwayat belajar
          </Link>
        </div>
      </section>
      {related.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-h2 text-foreground">
              Lanjutkan dengan materi ini
            </h2>
            <p className="text-small text-muted-foreground">
              Dipilih dari kategori yang sama
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {related.map((m) => (
              <div key={m.id} className="flex flex-col gap-3">
                <MaterialCard
                  title={m.title}
                  category={m.category}
                  description={m.description}
                  organization={`${m.organization} · ${m.trainer}`}
                  organizationLogo={m.logoUrl}
                  sections={m.sections}
                  duration={formatDuration(m.minutes)}
                  learners={m.learners}
                  status="not-started"
                  cover={m.cover}
                  className="flex-1 sm:max-w-none"
                />
                <Link
                  href={`/jelajah/materi/${m.id}`}
                  className={buttonVariants()}
                >
                  Lihat detail &amp; ikuti
                  <ArrowUpRightIcon aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
