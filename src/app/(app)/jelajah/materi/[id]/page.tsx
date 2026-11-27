import {
  ArrowRightIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarIcon,
  CircleCheckIcon,
  InfoIcon,
  LockIcon,
  PaperclipIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnrollButton } from "@/app/(app)/materi/_components/enroll-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { OrgLogo } from "@/components/ui/org-logo";
import { db } from "@/lib/db";
import { COVER_CLASS } from "@/lib/event-cover";
import { visibleMaterialWhere } from "@/lib/material-access";
import {
  formatDuration,
  materialCover,
  materialLevelLabels,
  sectionKind,
  sectionKindLabels,
} from "@/lib/material-rules";
import { KIND_ICON, KIND_TONE } from "@/lib/material-section-ui";
import { logoUrlOf } from "@/lib/organization-access";
import { roleLabels } from "@/lib/rbac";
import { requirePermission } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail materi" };

export default async function MaterialDetailPage({
  params,
}: PageProps<"/jelajah/materi/[id]">) {
  const user = await requirePermission("material:enroll");
  const { id } = await params;
  const material = await db.material.findFirst({
    where: {
      id,
      ...visibleMaterialWhere,
      OR: [
        { visibility: "PUBLIC" },
        {
          events: {
            some: { event: { enrollments: { some: { userId: user.id } } } },
          },
        },
      ],
    },
    include: {
      category: { select: { name: true } },
      trainer: { select: { name: true } },
      organization: {
        select: {
          name: true,
          logo: { select: { key: true, name: true, contentType: true } },
        },
      },
      sections: {
        orderBy: { order: "asc" },
        include: { file: { select: { contentType: true } } },
      },
      enrollments: { where: { userId: user.id }, select: { id: true } },
      events: {
        where: { event: { status: { in: ["PUBLISHED", "CLOSED"] } } },
        select: {
          event: {
            select: {
              id: true,
              title: true,
              creator: {
                select: { name: true, membership: { select: { role: true } } },
              },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!material) notFound();
  const enrolled = material.enrollments.length > 0;
  const minutes = material.sections.reduce(
    (s, x) => s + (x.durationMinutes ?? 0),
    0,
  );
  const logoUrl = await logoUrlOf(material.organization.logo);

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/jelajah" className="hover:text-foreground">
          Jelajah
        </Link>{" "}
        /{" "}
        <Link href="/jelajah?tab=materi" className="hover:text-foreground">
          Materi
        </Link>{" "}
        / {material.title}
      </nav>
      <section
        className={cn(
          "flex flex-col gap-3 rounded-2xl p-5 sm:p-7",
          COVER_CLASS[materialCover(material.coverColor)],
        )}
      >
        <p className="text-overline uppercase">{material.category.name}</p>
        <h1 className="text-display break-words">{material.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-small">
          <OrgLogo name={material.organization.name} src={logoUrl} size="sm" />
          <span className="text-small-strong">
            {material.organization.name}
          </span>
          <span>· Trainer: {material.trainer.name}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge size="sm" tone="primary" className="bg-card">
            {materialLevelLabels[material.level]}
          </Badge>
          <Badge size="sm" tone="neutral" className="bg-card">
            <BookOpenIcon aria-hidden="true" />
            Tanpa tugas
          </Badge>
          <Badge size="sm" tone="neutral" className="bg-card">
            <AwardIcon aria-hidden="true" />
            Tanpa sertifikat
          </Badge>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <IconBox icon={InfoIcon} tone="primary" size="sm" />
              <h2 className="text-h2 text-foreground">Tentang materi</h2>
            </div>
            <p className="text-body whitespace-pre-line text-label">
              {material.description}
            </p>
            {material.outcomes.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
                <h3 className="text-small-strong text-foreground">
                  Yang akan Anda pelajari
                </h3>
                <ul className="flex flex-col gap-2">
                  {material.outcomes.map((outcome) => (
                    <li
                      key={outcome}
                      className="flex items-start gap-2 text-small text-label"
                    >
                      <CircleCheckIcon
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-success-600"
                      />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <IconBox icon={LockIcon} tone="primary" size="sm" />
              <div className="flex flex-col gap-0.5">
                <h2 className="text-h2 text-foreground">Isi materi</h2>
                <p className="text-caption text-muted-foreground">
                  {material.sections.length} bagian ·{" "}
                  {enrolled
                    ? "sudah terbuka untuk Anda"
                    : "terbuka setelah Anda mengikuti materi"}
                </p>
              </div>
            </div>
            <ol className="flex flex-col gap-2">
              {material.sections.map((s) => {
                const kind = sectionKind({
                  fileContentType: s.file?.contentType,
                  link: s.link,
                });
                const Icon = KIND_ICON[kind];
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        KIND_TONE[kind],
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-small-strong text-foreground">
                        {s.order}. {s.title}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {sectionKindLabels[kind]}
                        {s.durationMinutes
                          ? ` · ${s.durationMinutes} menit`
                          : ""}
                      </span>
                    </span>
                    {!enrolled && (
                      <LockIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-subtle"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-display text-foreground">Gratis</h2>
              <p className="text-small text-muted-foreground">
                Belajar kapan saja, tanpa tenggat
              </p>
            </div>
            {enrolled ? (
              <Link
                href={`/materi/${material.id}`}
                className={buttonVariants()}
              >
                Lanjutkan belajar
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            ) : (
              <EnrollButton materialId={material.id} />
            )}
            <dl className="flex flex-col divide-y divide-border text-small">
              {[
                [
                  "Bagian",
                  minutes > 0
                    ? `${material.sections.length} bagian · ${formatDuration(minutes)}`
                    : `${material.sections.length} bagian`,
                ],
                ["Peserta", `${material._count.enrollments} mengikuti`],
                ["Tugas & nilai", "Tidak ada"],
                ["Sertifikat", "Tidak ada"],
                ["Bukti belajar", "Riwayat belajar"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 py-2">
                  <dt className="text-label">{label}</dt>
                  <dd className="text-right text-small-strong text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          {material.events.length > 0 && (
            <section className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <IconBox icon={PaperclipIcon} tone="primary" size="sm" />
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-h3 text-foreground">
                    Juga materi pendukung di
                  </h2>
                  <p className="text-caption text-muted-foreground">
                    {material.events.length} acara
                  </p>
                </div>
              </div>
              {material.events.map(({ event }, idx) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 text-small"
                >
                  <IconBox
                    icon={CalendarIcon}
                    tone={idx % 2 === 0 ? "blue" : "sage"}
                    size="sm"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-small-strong text-foreground">
                      {event.title}
                    </span>
                    <span className="truncate text-caption text-muted-foreground">
                      {event.creator.name}
                      {event.creator.membership
                        ? ` (${roleLabels[event.creator.membership.role]})`
                        : ""}
                    </span>
                  </span>
                </div>
              ))}
            </section>
          )}
          <p className="flex items-start gap-2 text-caption text-muted-foreground">
            <BookOpenIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            Materi yang selesai tercatat di Portofolio › Riwayat belajar.
          </p>
        </aside>
      </div>
    </div>
  );
}
