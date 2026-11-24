import {
  ArrowUpRightIcon,
  ClipboardCheckIcon,
  MessageSquareWarningIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  hrefWith,
  PAGE_SIZE,
  pageOf,
  param,
} from "@/app/(app)/_components/href";
import { LinkTabs } from "@/app/(app)/_components/link-tabs";
import { SearchParamInput } from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { SectionCard } from "@/app/(app)/_components/section-card";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  MilestoneProgressCell,
  type CellStatus,
} from "@/components/ui/milestone-progress-cell";
import { Progress, ProgressLegend } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAssessableEvent } from "@/lib/assessment";
import { db } from "@/lib/db";
import { eventPhase, finalScore } from "@/lib/event-rules";
import { formatDate, formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pantau progres" };

const TABS = [
  { value: "semua", label: "Semua peserta" },
  { value: "perlu", label: "Perlu dinilai" },
  { value: "revisi", label: "Revisi" },
  { value: "belum", label: "Belum mengumpulkan" },
  { value: "survei", label: "Survei belum diisi" },
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function ProgressPage({
  params,
  searchParams,
}: PageProps<"/ruang-kerja/acara/[id]">) {
  const { id } = await params;
  const { event } = await requireAssessableEvent(id);
  const sp = await searchParams;
  const PATH = `/ruang-kerja/acara/${id}`;
  const q = param(sp, "q").trim().toLowerCase();
  const tab = TABS.find((t) => t.value === param(sp, "tab"))?.value ?? "semua";

  const [milestones, enrollments] = await Promise.all([
    db.milestone.findMany({
      where: { eventId: id },
      orderBy: { order: "asc" },
      select: {
        id: true,
        order: true,
        title: true,
        survey: { select: { responses: { select: { userId: true } } } },
        submissions: {
          orderBy: { version: "desc" },
          select: {
            id: true,
            userId: true,
            version: true,
            status: true,
            submittedAt: true,
            grade: { select: { score: true } },
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { eventId: id },
      orderBy: [{ team: { name: "asc" } }, { user: { name: "asc" } }],
      select: {
        userId: true,
        user: { select: { name: true, email: true } },
        team: { select: { id: true, name: true, leaderId: true } },
      },
    }),
  ]);

  const rows = enrollments.map((en) => {
    const cells = milestones.map((m) => {
      const latest = m.submissions.find((s) => s.userId === en.userId) ?? null;
      const surveyPending =
        Boolean(latest && m.survey) &&
        !m.survey!.responses.some((r) => r.userId === en.userId);
      const status: CellStatus = !latest
        ? "empty"
        : latest.status === "GRADED"
          ? "graded"
          : latest.status === "REVISION_REQUESTED"
            ? "revision"
            : "submitted";
      return { milestone: m, latest, status, surveyPending };
    });
    const submitted = cells.filter((c) => c.latest).length;
    const final = finalScore(
      cells.map((c) =>
        c.status === "graded" && c.latest?.grade ? c.latest.grade.score : null,
      ),
    );
    const toReview = cells.find((c) => c.status === "submitted")?.latest;
    const anyLatest = cells.find((c) => c.latest)?.latest;
    return { en, cells, submitted, final, toReview, anyLatest };
  });

  const counts = {
    semua: rows.length,
    perlu: rows.filter((r) => r.cells.some((c) => c.status === "submitted"))
      .length,
    revisi: rows.filter((r) => r.cells.some((c) => c.status === "revision"))
      .length,
    belum: rows.filter((r) => r.submitted < milestones.length).length,
    survei: rows.filter((r) => r.cells.some((c) => c.surveyPending)).length,
  };
  const filtered = rows.filter((r) => {
    if (
      q &&
      !r.en.user.name.toLowerCase().includes(q) &&
      !r.en.user.email.toLowerCase().includes(q)
    )
      return false;
    if (tab === "perlu") return r.cells.some((c) => c.status === "submitted");
    if (tab === "revisi") return r.cells.some((c) => c.status === "revision");
    if (tab === "belum") return r.submitted < milestones.length;
    if (tab === "survei") return r.cells.some((c) => c.surveyPending);
    return true;
  });
  const page = pageOf(sp);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalTasks = rows.length * milestones.length;
  const totalSubmitted = rows.reduce((sum, r) => sum + r.submitted, 0);
  const overall =
    totalTasks === 0 ? 0 : Math.round((totalSubmitted / totalTasks) * 100);
  const ungraded = rows.reduce(
    (sum, r) => sum + r.cells.filter((c) => c.status === "submitted").length,
    0,
  );
  const revisions = rows.reduce(
    (sum, r) => sum + r.cells.filter((c) => c.status === "revision").length,
    0,
  );
  const isTeam = event.participantType === "TEAM";

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-small text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ruang-kerja/acara" className="hover:text-foreground">
          Acara Saya
        </Link>{" "}
        / {event.title} / Pantau progres
      </nav>
      <div className="flex flex-col gap-1">
        <h1 className="text-display text-foreground">Pantau progres peserta</h1>
        <p className="text-small text-muted-foreground">
          Lihat perkembangan tiap milestone dan buka tugas untuk menilai atau
          memberi revisi.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl bg-primary-50 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-caption text-label">
            <PhaseBadge phase={eventPhase(event)} />
            {milestones.length} milestone · Berurutan
            {isTeam && " · Acara tim"}
          </div>
          <h2 className="text-h2 text-foreground">{event.title}</h2>
          {event.startsAt && event.endsAt && (
            <p className="text-small text-muted-foreground">
              {formatDate(event.startsAt)} – {formatDate(event.endsAt)}
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-72">
          <div className="flex items-center justify-between">
            <span className="text-small text-label">
              Pengumpulan keseluruhan
            </span>
            <span className="text-h3 text-primary-600">{overall}%</span>
          </div>
          <Progress value={overall} />
          <span className="text-caption text-muted-foreground">
            {totalSubmitted} dari {totalTasks} tugas milestone dikumpulkan
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={UsersIcon}
          label="Peserta terdaftar"
          value={rows.length}
          delta="Total peserta dalam acara"
        />
        <StatCard
          icon={ClipboardCheckIcon}
          label="Tugas belum dinilai"
          value={ungraded}
          delta="Termasuk pengiriman revisi terbaru"
        />
        <StatCard
          icon={MessageSquareWarningIcon}
          label="Tugas berstatus revisi"
          value={revisions}
          delta="Menunggu unggahan ulang peserta"
        />
      </div>

      <SectionCard
        title="Progres per milestone"
        description="Pilih peserta untuk membuka tugas, rubrik penilaian, dan catatan revisi."
      >
        <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5">
          <SearchParamInput
            label="Cari peserta"
            placeholder="Cari nama atau email peserta…"
          />
          <LinkTabs
            label="Filter peserta"
            active={tab}
            tabs={TABS.map((t) => ({
              value: t.value,
              label: t.label,
              count: counts[t.value],
              href: hrefWith(PATH, sp, {
                tab: t.value === "semua" ? null : t.value,
                page: null,
              }),
            }))}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peserta</TableHead>
                <TableHead>Progres</TableHead>
                {milestones.map((m) => (
                  <TableHead key={m.id}>
                    <span className="block">Milestone {m.order}</span>
                    <span className="block max-w-30 truncate font-normal">
                      {m.title}
                    </span>
                  </TableHead>
                ))}
                <TableHead>Nilai akhir</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={milestones.length + 4}
                    className="py-10 text-center text-small text-muted-foreground"
                  >
                    Tidak ada peserta yang cocok.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r, i) => {
                const prevTeam = visible[i - 1]?.en.team?.id;
                const target = r.toReview ?? r.anyLatest;
                return (
                  <TeamAwareRow
                    key={r.en.userId}
                    showTeam={
                      isTeam && r.en.team && r.en.team.id !== prevTeam
                        ? r.en.team.name
                        : null
                    }
                    colSpan={milestones.length + 4}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-caption-strong text-primary-600">
                          {initials(r.en.user.name)}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-small-strong text-foreground">
                            {r.en.user.name}
                          </span>
                          {r.en.team?.leaderId === r.en.userId ? (
                            <span className="text-caption text-muted-foreground">
                              Ketua tim
                            </span>
                          ) : r.toReview ? (
                            <Badge size="sm" className="w-fit">
                              Baru dikumpulkan
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex w-16 flex-col gap-1">
                        <span className="text-small text-label">
                          {r.submitted} / {milestones.length}
                        </span>
                        <Progress
                          value={
                            milestones.length === 0
                              ? 0
                              : (r.submitted / milestones.length) * 100
                          }
                        />
                      </div>
                    </TableCell>
                    {r.cells.map((c) => (
                      <TableCell key={c.milestone.id}>
                        {c.latest ? (
                          <Link
                            href={`${PATH}/nilai/${c.latest.id}`}
                            className="block rounded-md hover:bg-muted"
                          >
                            <MilestoneProgressCell
                              status={c.status}
                              value={
                                c.status === "graded" && c.latest.grade
                                  ? formatScore(c.latest.grade.score)
                                  : c.status === "submitted"
                                    ? "Dikumpulkan"
                                    : undefined
                              }
                              date={
                                c.surveyPending
                                  ? "Survei belum diisi"
                                  : undefined
                              }
                            />
                          </Link>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      {r.final === null ? (
                        <span className="text-caption text-muted-foreground">
                          Menunggu semua milestone
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "text-body-strong",
                            r.final >= event.kkm
                              ? "text-success-700"
                              : "text-danger-700",
                          )}
                        >
                          {formatScore(r.final)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {target ? (
                        <Link
                          href={`${PATH}/nilai/${target.id}`}
                          className={buttonVariants({
                            size: "sm",
                            variant: r.toReview ? "primary" : "secondary",
                          })}
                        >
                          {r.toReview ? "Tinjau" : "Rincian"}
                          <ArrowUpRightIcon aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="text-caption text-subtle">
                          Belum ada tugas
                        </span>
                      )}
                    </TableCell>
                  </TeamAwareRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          <ProgressLegend />
          <ListFooter
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            noun="peserta"
            hrefFor={(p) => hrefWith(PATH, sp, { page: p })}
          />
        </div>
      </SectionCard>
      <p className="text-caption text-muted-foreground">
        Milestone berikutnya terbuka setelah tugas dan survei milestone
        sebelumnya selesai. Penilaian guru tidak menghambat peserta.
      </p>
    </div>
  );
}

function TeamAwareRow({
  showTeam,
  colSpan,
  children,
}: {
  showTeam: string | null;
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <>
      {showTeam && (
        <TableRow className="bg-muted/60 hover:bg-muted/60">
          <TableCell
            colSpan={colSpan}
            className="text-caption-strong text-label"
          >
            {showTeam}
          </TableCell>
        </TableRow>
      )}
      <TableRow>{children}</TableRow>
    </>
  );
}
