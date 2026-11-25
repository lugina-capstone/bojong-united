import { WebLink } from "@/components/ui/web-link";
import {
  BookOpenIcon,
  CheckIcon,
  DownloadIcon,
  ExternalLinkIcon,
  InfoIcon,
  ListChecksIcon,
  LockIcon,
} from "lucide-react";
import type { Metadata } from "next";
import type * as React from "react";
import Link from "next/link";

import { SectionActions } from "@/app/(app)/materi/_components/section-actions";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { COVER_CLASS } from "@/lib/event-cover";
import { formatFileSize } from "@/lib/format";
import { loadLearning } from "@/lib/material-learning";
import {
  canOpenSection,
  lastOpenSection,
  materialCover,
  sectionKind,
  sectionKindLabels,
} from "@/lib/material-rules";
import { KIND_ICON, KIND_TONE } from "@/lib/material-section-ui";
import { requirePermission } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ruang belajar" };

function SectionLink({
  open,
  href,
  className,
  children,
  ...rest
}: React.ComponentProps<"a"> & { open: boolean; href: string }) {
  if (open) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <span
      aria-disabled="true"
      title="Selesaikan bagian sebelumnya terlebih dahulu"
      className={cn(className, "cursor-not-allowed opacity-60")}
    >
      {children}
    </span>
  );
}

export default async function LearnPage({
  params,
  searchParams,
}: PageProps<"/materi/[id]">) {
  const user = await requirePermission("material:enroll");
  const { id } = await params;
  const { bagian } = await searchParams;
  const { enrollment, material, done } = await loadLearning(id, user.id);
  const sections = material.sections;
  const doneFlags = sections.map((s) => done.has(s.id));
  const lastOpen = lastOpenSection(doneFlags);
  const requested = Number(bagian) - 1;
  const index = canOpenSection(requested, doneFlags)
    ? requested
    : Math.max(0, lastOpen);
  const current = sections[index];
  const href = (i: number) => `/materi/${id}?bagian=${i + 1}`;
  const doneCount = sections.filter((s) => done.has(s.id)).length;

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/portofolio?tab=belajar" className="hover:text-foreground">
          Portofolio / Riwayat belajar
        </Link>{" "}
        / {material.title}
      </nav>
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl",
              COVER_CLASS[materialCover(material.coverColor)],
            )}
          >
            <BookOpenIcon aria-hidden="true" className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <h1 className="text-h1 break-words text-foreground">
              {material.title}
            </h1>
            <p className="text-small text-muted-foreground">
              {material.organization.name} · {material.trainer.name} · belajar
              mandiri tanpa tugas &amp; nilai
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-56">
          <div className="flex justify-between text-small">
            <span className="text-label">Progres belajar</span>
            <span className="text-small-strong text-primary-600">
              {doneCount}/{sections.length} · {enrollment.progress}%
            </span>
          </div>
          <Progress value={enrollment.progress} label="Progres belajar" />
        </div>
      </section>
      {material.status === "ARCHIVED" && (
        <p className="flex items-start gap-2 rounded-xl bg-warning-50 p-3 text-small text-warning-700">
          <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Materi ini sudah diarsipkan Trainer. Anda tetap bisa membacanya karena
          sudah mengikutinya.
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:self-start">
          <h2 className="flex items-center gap-2 text-h3 text-foreground">
            <ListChecksIcon
              aria-hidden="true"
              className="size-4 text-primary-500"
            />
            Bagian materi
          </h2>
          <ol className="flex flex-col gap-1">
            {sections.map((s, i) => {
              const kind = sectionKind({
                fileContentType: s.file?.contentType,
                link: s.link,
              });
              const isDone = done.has(s.id);
              return (
                <li key={s.id}>
                  <SectionLink
                    open={canOpenSection(i, doneFlags)}
                    href={href(i)}
                    aria-current={i === index ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2.5",
                      i === index
                        ? "border-primary-200 bg-primary-50"
                        : "border-transparent hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6.5 shrink-0 items-center justify-center rounded-full text-caption-strong",
                        isDone
                          ? "bg-success-500 text-inverse"
                          : i === index
                            ? "bg-primary-500 text-inverse"
                            : "bg-muted text-label",
                      )}
                    >
                      {isDone ? (
                        <CheckIcon aria-hidden="true" className="size-3.5" />
                      ) : canOpenSection(i, doneFlags) ? (
                        i + 1
                      ) : (
                        <LockIcon aria-hidden="true" className="size-3.5" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-small-strong text-foreground">
                        {s.title}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {sectionKindLabels[kind]}
                        {s.durationMinutes
                          ? ` · ${s.durationMinutes} menit`
                          : ""}
                      </span>
                    </span>
                  </SectionLink>
                </li>
              );
            })}
          </ol>
        </section>
        {current && (
          <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            {(() => {
              const kind = sectionKind({
                fileContentType: current.file?.contentType,
                link: current.link,
              });
              const Icon = KIND_ICON[kind];
              return (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        KIND_TONE[kind],
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4.5" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <h2 className="text-h2 break-words text-foreground">
                        {index + 1}. {current.title}
                      </h2>
                      <span className="text-caption text-muted-foreground">
                        {sectionKindLabels[kind]}
                        {current.file
                          ? ` · ${current.file.name} · ${formatFileSize(current.file.size)}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  {current.file && (
                    <a
                      href={`/api/files/${current.file.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      <DownloadIcon aria-hidden="true" />
                      Unduh
                    </a>
                  )}
                </div>
              );
            })()}
            <div className="flex min-h-40 flex-col gap-3 rounded-xl bg-muted p-4 sm:p-6">
              {current.content && (
                <p className="text-body whitespace-pre-line text-label">
                  {current.content}
                </p>
              )}
              {current.link && (
                <WebLink
                  href={current.link}
                  className={buttonVariants({
                    variant: "secondary",
                    className: "w-fit",
                  })}
                >
                  <ExternalLinkIcon aria-hidden="true" />
                  Buka tautan materi
                </WebLink>
              )}
              {current.file && !current.content && (
                <p className="text-small text-muted-foreground">
                  Unduh berkas untuk mempelajari bagian ini, lalu tandai
                  selesai.
                </p>
              )}
            </div>
            <SectionActions
              materialId={id}
              sectionId={current.id}
              done={done.has(current.id)}
              prevHref={index > 0 ? href(index - 1) : null}
              nextHref={index < sections.length - 1 ? href(index + 1) : null}
            />
            <p className="flex items-start gap-2 rounded-xl bg-primary-50 p-3 text-caption text-primary-700">
              <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Materi ini tidak memiliki tugas atau penilaian. Tandai bagian
              selesai untuk mencatat progres di Riwayat belajar.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
