import {
  ArrowUpRightIcon,
  CalendarIcon,
  CircleCheckIcon,
  ClockIcon,
  CompassIcon,
  HistoryIcon,
  LayersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { MaterialCard } from "@/components/ui/material-card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";
import { visibleMaterialWhere } from "@/lib/material-access";
import { materialCardsFor } from "@/lib/material-catalog";
import { loadLearning } from "@/lib/material-learning";
import { formatDuration, materialLevelLabels } from "@/lib/material-rules";
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
  const sameCategory = await materialCardsFor(
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
  const moreRelated =
    sameCategory.length < 3
      ? await materialCardsFor(
          user.id,
          {
            ...visibleMaterialWhere,
            visibility: "PUBLIC",
            id: { notIn: [id, ...sameCategory.map((m) => m.id)] },
            enrollments: { none: { userId: user.id } },
          },
          { skip: 0, take: 3 - sameCategory.length },
        )
      : [];
  const related = [...sameCategory, ...moreRelated];
  const allSameCategory = moreRelated.length === 0;

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
        <p className="text-overline text-success-700 uppercase">
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
              tone: "blue" as const,
              value: `${material.sections.length} / ${material.sections.length}`,
              label: "Bagian selesai",
            },
            {
              icon: ClockIcon,
              tone: "peach" as const,
              value: formatDuration(minutes),
              label: "Waktu belajar",
            },
            {
              icon: CalendarIcon,
              tone: "sage" as const,
              value: formatDate(enrollment.completedAt),
              label: "Diselesaikan",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left"
            >
              <IconBox icon={s.icon} tone={s.tone} size="md" />
              <span className="flex flex-col">
                <span className="text-h3 text-foreground">{s.value}</span>
                <span className="text-caption text-muted-foreground">
                  {s.label}
                </span>
              </span>
            </div>
          ))}
        </div>
        <Alert
          tone="info"
          title="Tanpa sertifikat"
          className="max-w-2xl text-left"
        >
          Materi tidak menerbitkan sertifikat. Riwayat ini tampil di Portofolio
          › Riwayat belajar dan bisa dibuka kembali kapan saja.
        </Alert>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/jelajah?tab=materi"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <CompassIcon aria-hidden="true" />
            Jelajah materi lain
          </Link>
          <Link
            href="/portofolio?tab=belajar"
            className={buttonVariants({ size: "lg" })}
          >
            <HistoryIcon aria-hidden="true" />
            Lihat riwayat belajar
          </Link>
        </div>
      </section>
      {related.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-h3 text-foreground">
                Lanjutkan dengan materi ini
              </h2>
              <p className="text-small text-muted-foreground">
                {allSameCategory
                  ? "Dipilih dari kategori yang sama"
                  : "Rekomendasi materi belajar lainnya"}
              </p>
            </div>
            <Link
              href="/jelajah?tab=materi"
              className="inline-flex w-fit items-center gap-1 text-small-strong text-primary-500 hover:underline"
            >
              Lihat semua
              <ArrowUpRightIcon aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {related.map((m) => (
              <MaterialCard
                key={m.id}
                title={m.title}
                category={m.category}
                description={m.description}
                organization={m.organization}
                trainer={m.trainer}
                organizationLogo={m.logoUrl}
                levelLabel={materialLevelLabels[m.level]}
                sections={m.sections}
                duration={formatDuration(m.minutes)}
                learners={m.learners}
                status="not-started"
                cover={m.cover}
                className="sm:max-w-none"
                action={
                  <Link
                    href={`/jelajah/materi/${m.id}`}
                    className={buttonVariants({ className: "w-full" })}
                  >
                    Lihat detail &amp; ikuti
                    <ArrowUpRightIcon aria-hidden="true" />
                  </Link>
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
