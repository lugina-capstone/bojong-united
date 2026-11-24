import {
  ArrowRightIcon,
  FileTextIcon,
  ImagesIcon,
  LinkIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { param } from "@/app/(app)/_components/href";
import { SearchParamInput } from "@/app/(app)/_components/list-controls";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAssessableEvent } from "@/lib/assessment";
import { kkmStatusLabel, loadEventResults } from "@/lib/event-results";
import { formatScore } from "@/lib/format";

export const metadata: Metadata = { title: "Galeri karya acara" };

export default async function EventGalleryPage({
  params,
  searchParams,
}: PageProps<"/ruang-kerja/galeri/[id]">) {
  const { id } = await params;
  const { event } = await requireAssessableEvent(id);
  const q = param(await searchParams, "q")
    .trim()
    .toLowerCase();
  const { milestones, rows } = await loadEventResults(id, event.kkm);
  const visible = rows.filter(
    (r) => r.submitted > 0 && (!q || r.name.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/galeri" className="hover:text-foreground">
          Galeri Karya
        </Link>{" "}
        / {event.title}
      </nav>
      <div className="flex flex-col gap-1">
        <h1 className="text-display text-foreground">{event.title}</h1>
        <p className="text-small text-muted-foreground">
          {visible.length} peserta dengan karya · {milestones.length} milestone
        </p>
      </div>
      <SearchParamInput label="Cari peserta" placeholder="Cari nama peserta…" />
      {visible.length === 0 ? (
        <EmptyState
          icon={ImagesIcon}
          title="Belum ada karya"
          description="Karya tampil setelah peserta mengumpulkan tugas milestone."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => {
            const last = [...r.cells].reverse().find((c) => c.latest)?.latest;
            return (
              <article
                key={r.userId}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-subtle">
                  {last?.file ? (
                    <FileTextIcon aria-hidden="true" className="size-8" />
                  ) : last?.link ? (
                    <LinkIcon aria-hidden="true" className="size-8" />
                  ) : (
                    <ImagesIcon aria-hidden="true" className="size-8" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-h3 text-foreground">{r.name}</h2>
                  <span className="text-caption text-muted-foreground">
                    {r.team ?? "Peserta"} · {r.submitted}/{milestones.length}{" "}
                    milestone dikumpulkan
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    size="sm"
                    tone={
                      r.kkmStatus === "lulus"
                        ? "success"
                        : r.kkmStatus === "bawah"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {kkmStatusLabel[r.kkmStatus]}
                  </Badge>
                  {r.final !== null && (
                    <span className="text-small-strong text-foreground">
                      Nilai {formatScore(r.final)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/ruang-kerja/galeri/${id}/${r.userId}`}
                  className={buttonVariants({
                    variant: "secondary",
                    className: "mt-auto",
                  })}
                >
                  Lihat karya
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
