import { ExternalLinkIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireAssessableEvent } from "@/lib/assessment";
import { kkmStatusLabel, loadEventResults } from "@/lib/event-results";
import { formatDateTime, formatScore } from "@/lib/format";

export const metadata: Metadata = { title: "Karya peserta" };

export default async function WorkDetailPage({
  params,
}: PageProps<"/ruang-kerja/galeri/[id]/[userId]">) {
  const { id, userId } = await params;
  const { event } = await requireAssessableEvent(id);
  const { rows } = await loadEventResults(id, event.kkm);
  const row = rows.find((r) => r.userId === userId);
  if (!row) notFound();

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/galeri" className="hover:text-foreground">
          Galeri Karya
        </Link>{" "}
        /{" "}
        <Link
          href={`/ruang-kerja/galeri/${id}`}
          className="hover:text-foreground"
        >
          {event.title}
        </Link>{" "}
        / {row.name}
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-foreground">{row.name}</h1>
          <p className="text-small text-muted-foreground">
            {row.team ? `${row.team} · ` : ""}
            {event.title}
          </p>
        </div>
        <Badge tone="neutral" className="w-fit">
          <LockIcon aria-hidden="true" />
          Hanya baca
        </Badge>
      </div>
      <dl className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">Nilai akhir</dt>
          <dd className="text-h2 text-foreground">
            {row.final === null ? "—" : formatScore(row.final)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">Status KKM</dt>
          <dd className="text-body-strong text-foreground">
            {kkmStatusLabel[row.kkmStatus]} (KKM {event.kkm})
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">Sertifikat</dt>
          <dd className="text-body-strong text-foreground">
            {row.certificate ? (
              <Link
                href={`/sertifikat/${row.certificate}`}
                className="text-primary-600 hover:underline"
              >
                {row.certificate}
              </Link>
            ) : (
              "Belum terbit"
            )}
          </dd>
        </div>
      </dl>
      <ol className="flex flex-col gap-4">
        {row.cells.map((c) => (
          <li
            key={c.milestone.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-h3 text-foreground">
                Milestone {c.milestone.order} · {c.milestone.title}
              </h2>
              {c.latest?.grade ? (
                <Badge tone="success" size="sm">
                  Nilai {formatScore(c.latest.grade.score)}
                </Badge>
              ) : c.latest ? (
                <Badge tone="warning" size="sm">
                  {c.latest.status === "REVISION_REQUESTED"
                    ? "Revisi"
                    : "Menunggu dinilai"}
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  Belum kumpul
                </Badge>
              )}
            </div>
            {c.latest && (
              <>
                <span className="text-caption text-muted-foreground">
                  Versi {c.latest.version} ·{" "}
                  {formatDateTime(c.latest.submittedAt)}
                </span>
                {c.latest.file && (
                  <a
                    href={`/api/files/${c.latest.file.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 text-small text-primary-600 hover:underline"
                  >
                    {c.latest.file.name}
                    <ExternalLinkIcon aria-hidden="true" className="size-4" />
                  </a>
                )}
                {c.latest.link && (
                  <a
                    href={c.latest.link}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-small text-primary-600 hover:underline"
                  >
                    {c.latest.link}
                  </a>
                )}
                {c.latest.text && (
                  <p className="text-small whitespace-pre-line text-label">
                    {c.latest.text}
                  </p>
                )}
                {c.latest.grade?.feedback && (
                  <p className="rounded-lg bg-muted p-3 text-small text-label">
                    Umpan balik: {c.latest.grade.feedback}
                  </p>
                )}
                <Link
                  href={`/ruang-kerja/tugas/${id}/nilai/${c.latest.id}`}
                  className={buttonVariants({
                    variant: "link",
                    size: "sm",
                    className: "w-fit px-0",
                  })}
                >
                  Riwayat versi &amp; penilaian
                </Link>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
