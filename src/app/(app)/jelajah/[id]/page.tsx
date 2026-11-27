import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  CalendarIcon,
  CircleCheckIcon,
  LockIcon,
  RouteIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { orgTypeLabel } from "@/app/(app)/_components/badges";
import { PhaseBadge } from "@/app/(app)/jelajah/_components/phase-badge";
import { InviteResponse } from "@/app/(app)/jelajah/[id]/_components/invite-response";
import { JoinPanel } from "@/app/(app)/jelajah/[id]/_components/join-panel";
import { TeamCard } from "@/app/(app)/jelajah/[id]/_components/team-card";
import { OrgLogo } from "@/components/ui/org-logo";
import { db } from "@/lib/db";
import { visibleEventWhere } from "@/lib/event-query";
import { eventPhase, maskEmail } from "@/lib/event-rules";
import { formatDate, formatDateTime } from "@/lib/format";
import { logoUrlOf } from "@/lib/organization-access";
import { hasStarted, requireParticipant } from "@/lib/participant-access";
import { formatLabels } from "@/lib/validations/event";

export const metadata: Metadata = { title: "Detail acara" };

const wib = (date: Date | null) => (date ? `${formatDateTime(date)} WIB` : "-");

export default async function EventDetailPage({
  params,
}: PageProps<"/jelajah/[id]">) {
  const { id } = await params;
  const user = await requireParticipant();
  const event = await db.event.findFirst({
    where: {
      id,
      OR: [
        visibleEventWhere,
        {
          status: { not: "DRAFT" },
          enrollments: { some: { userId: user.id } },
        },
      ],
    },
    include: {
      field: { select: { name: true } },
      creator: { select: { name: true } },
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          logo: { select: { key: true, name: true, contentType: true } },
          _count: {
            select: { events: { where: { status: "PUBLISHED" } } },
          },
        },
      },
      milestones: {
        orderBy: { order: "asc" },
        include: {
          rubric: {
            select: {
              id: true,
              title: true,
              criteria: { orderBy: { order: "asc" }, select: { name: true } },
            },
          },
        },
      },
      _count: { select: { enrollments: true, teams: true } },
    },
  });
  if (!event) notFound();

  const [enrollment, invites, logoUrl] = await Promise.all([
    db.enrollment.findUnique({
      where: { eventId_userId: { eventId: id, userId: user.id } },
      include: {
        team: {
          include: {
            members: {
              orderBy: { createdAt: "asc" },
              include: { user: { select: { name: true, email: true } } },
            },
            invites: {
              where: { status: { in: ["PENDING", "REJECTED"] } },
              orderBy: { createdAt: "desc" },
              include: { invitee: { select: { name: true, email: true } } },
            },
          },
        },
      },
    }),
    db.teamInvite.findMany({
      where: { inviteeId: user.id, status: "PENDING", team: { eventId: id } },
      include: {
        team: { select: { name: true, leader: { select: { name: true } } } },
      },
    }),
    logoUrlOf(event.organization.logo),
  ]);

  const now = new Date();
  const phase = eventPhase(event, now);
  const started = hasStarted(event, now);
  const isTeam = event.participantType === "TEAM";
  const team = enrollment?.team ?? null;
  const closedReason =
    event.organization.status !== "APPROVED"
      ? "Acara dijeda karena organisasi penyelenggara dinonaktifkan."
      : phase === "finished" || phase === "archived"
        ? "Acara sudah berakhir."
        : isTeam && started
          ? "Pendaftaran tim ditutup setelah acara dimulai."
          : null;
  const rubrics = [
    ...new Map(
      event.milestones
        .filter((m) => m.rubric)
        .map((m) => [m.rubric!.id, m.rubric!]),
    ).values(),
  ];
  const fieldLabel = [event.field?.name, isTeam ? "Proyek tim" : null]
    .filter(Boolean)
    .join(" / ");

  const isTeamMember = Boolean(
    enrollment && isTeam && team?.leaderId !== user.id,
  );
  const dateRange =
    event.startsAt && event.endsAt
      ? `${formatDate(event.startsAt)} – ${formatDate(event.endsAt)}`
      : wib(event.startsAt);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/jelajah"
        className="inline-flex w-fit items-center gap-1.5 text-small text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Jelajah /{" "}
        {isTeamMember
          ? "Bergabung ke tim"
          : enrollment
            ? "Pendaftaran berhasil"
            : "Detail acara"}
      </Link>

      <section className="flex flex-col gap-4 rounded-2xl bg-primary-100 p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-overline text-primary-600 uppercase">
            {fieldLabel}
          </p>
          <PhaseBadge phase={phase} />
        </div>
        <h1 className="max-w-2xl text-display text-foreground">
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-label">
          <span className="inline-flex items-center gap-1.5 text-caption-strong text-foreground">
            <Building2Icon aria-hidden="true" className="size-4" />
            {event.organization.name}
          </span>
          <span>Guru: {event.creator.name}</span>
          <span>
            {event.milestones.length} milestone berurutan
            {isTeam
              ? ` · Acara tim, maks ${event.maxTeamMembers ?? 1} anggota`
              : ""}
          </span>
          {event.certificateEnabled && <span>Sertifikat bersyarat</span>}
        </div>
      </section>

      {invites.map((invite) => (
        <InviteResponse
          key={invite.id}
          inviteId={invite.id}
          inviterName={invite.team.leader.name}
          teamName={invite.team.name}
          eventTitle={event.title}
        />
      ))}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {team && (
            <TeamCard
              teamId={team.id}
              teamName={team.name}
              leaderId={team.leaderId}
              currentUserId={user.id}
              maxMembers={event.maxTeamMembers ?? 1}
              started={started}
              startLabel={wib(event.startsAt)}
              members={team.members.map((m) => ({
                enrollmentId: m.id,
                userId: m.userId,
                name: m.user.name,
                email: m.user.email,
              }))}
              invites={team.invites.map((i) => ({
                id: i.id,
                name: i.invitee.name,
                email: maskEmail(i.invitee.email),
                status: i.status as "PENDING" | "REJECTED",
              }))}
            />
          )}

          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-h2 text-foreground">
              Tantangan yang akan Anda kerjakan
            </h2>
            <p className="text-body whitespace-pre-line text-label">
              {event.description}
            </p>
            {event.guidelines ? (
              <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
                <h3 className="text-small-strong text-foreground">
                  Ketentuan dan arahan
                </h3>
                <p className="text-small whitespace-pre-line text-label">
                  {event.guidelines}
                </p>
              </div>
            ) : (
              event.milestones.length >= 2 && (
                <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
                  <h3 className="text-small-strong text-foreground">
                    Dari masalah menjadi solusi
                  </h3>
                  <p className="text-small text-label">
                    {event.milestones.map((m) => m.title).join(" → ")}.
                  </p>
                </div>
              )
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-h2 text-foreground">
                  Perjalanan pembelajaran
                </h2>
                <p className="text-small text-muted-foreground">
                  {isTeam
                    ? "Dikerjakan bersama tim, tetapi setiap anggota mengumpulkan tugas dan survei masing-masing."
                    : "Setiap milestone mencakup tugas dan survei. Rincian dapat dipelajari sebelum Anda mengikuti acara."}
                </p>
              </div>
              <span className="shrink-0 text-caption text-subtle">
                {event.milestones.length} milestone
              </span>
            </div>
            <ol className="flex flex-col divide-y divide-border">
              {event.milestones.map((milestone, index) => {
                const firstOpen = index === 0 && enrollment;
                return (
                  <li key={milestone.id} className="flex flex-col gap-2 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-50 text-caption-strong text-primary-600">
                        {milestone.order}
                      </span>
                      <h3 className="text-body-strong text-foreground">
                        {milestone.title}
                      </h3>
                    </div>
                    {milestone.instructions && (
                      <p className="text-small text-label">
                        {milestone.instructions}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                      <CalendarIcon aria-hidden="true" className="size-3.5" />
                      {wib(milestone.dueAt)}
                    </p>
                    <p className="text-caption text-subtle">
                      Format pengumpulan:{" "}
                      {milestone.formats.map((f) => formatLabels[f]).join(", ")}
                    </p>
                    {firstOpen ? (
                      <p className="flex items-center gap-1.5 text-caption text-success-600">
                        <CircleCheckIcon
                          aria-hidden="true"
                          className="size-3.5"
                        />
                        {started
                          ? "Terbuka · Siap dikerjakan"
                          : `Terbuka ${wib(event.startsAt)}`}
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-caption text-subtle">
                        <LockIcon aria-hidden="true" className="size-3.5" />
                        {index === 0
                          ? "Setelah mengikuti acara dan tanggal mulai tercapai"
                          : `Setelah tugas dan survei milestone ${index} selesai`}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="flex items-start gap-3 rounded-2xl bg-primary-50 p-5">
            <RouteIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary-500"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-body-strong text-foreground">
                Ikuti alurnya, bangun karya Anda
              </h2>
              <p className="text-small text-label">
                Milestone dikerjakan berurutan. Setelah mengumpulkan tugas, isi
                survei untuk membuka milestone berikutnya. Anda tidak perlu
                menunggu penilaian guru untuk melanjutkan.
              </p>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <JoinPanel
            eventId={event.id}
            title={event.title}
            isTeam={isTeam}
            teamName={team?.name}
            isLeader={team?.leaderId === user.id}
            enrolled={Boolean(enrollment)}
            closedReason={enrollment ? null : closedReason}
            startsAt={wib(event.startsAt)}
            endsAt={wib(event.endsAt)}
            dateRange={dateRange}
            creatorName={event.creator.name}
            milestoneCount={event.milestones.length}
            maxTeamMembers={event.maxTeamMembers ?? undefined}
            userName={user.name}
            userEmail={user.email}
            countLabel={
              isTeam
                ? `${event._count.teams} kelompok telah terbentuk`
                : `${event._count.enrollments} peserta telah mengikuti`
            }
          />

          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <p className="text-overline text-muted-foreground uppercase">
              Penyelenggara
            </p>
            <div className="flex items-center gap-3">
              <OrgLogo name={event.organization.name} src={logoUrl} />
              <div className="min-w-0">
                <p className="truncate text-body-strong text-foreground">
                  {event.organization.name}
                </p>
                <p className="text-caption text-muted-foreground">
                  {orgTypeLabel(event.organization.type)}
                </p>
              </div>
            </div>
            <dl className="flex flex-col gap-2 border-t border-border pt-3 text-small">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Guru pembimbing</dt>
                <dd className="text-right text-small-strong">
                  {event.creator.name}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Acara aktif</dt>
                <dd className="text-small-strong">
                  {event.organization._count.events} acara
                </dd>
              </div>
            </dl>
            <p className="text-caption text-muted-foreground">
              Terbuka untuk semua peserta. Anda tidak perlu bergabung ke
              organisasi ini.
            </p>
            <Link
              href={`/jelajah?org=${event.organization.id}`}
              className="inline-flex items-center gap-1 text-small-strong text-primary-500 hover:underline"
            >
              Lihat acara lain dari penyelenggara
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          </section>

          {rubrics.length > 0 && (
            <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-h3 text-foreground">
                Bagaimana karya Anda dinilai?
              </h2>
              {rubrics.map((rubric) => (
                <div key={rubric.id} className="flex flex-col gap-1">
                  <p className="text-small-strong text-foreground">
                    {rubric.title}
                  </p>
                  <ul className="flex flex-col divide-y divide-border">
                    {rubric.criteria.map((criterion) => (
                      <li
                        key={criterion.name}
                        className="flex justify-between gap-3 py-2 text-small text-label"
                      >
                        <span>{criterion.name}</span>
                        <span className="text-caption text-subtle">1–5</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-caption text-muted-foreground">
                Nilai milestone = (total skor ÷ skor maksimum) × 100. Nilai
                akhir adalah rata-rata seluruh milestone.
              </p>
            </section>
          )}

          {event.certificateEnabled && (
            <section className="flex flex-col gap-3 rounded-2xl bg-primary-50 p-5">
              <h2 className="text-h3 text-foreground">
                Karya selesai. Pencapaian tercatat.
              </h2>
              <ul className="flex flex-col gap-2 text-small text-label">
                {[
                  `Seluruh ${event.milestones.length} milestone selesai`,
                  "Semua nilai milestone sudah terbit",
                  `Nilai akhir minimal ${event.kkm}`,
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CircleCheckIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-caption text-muted-foreground">
                Sertifikat terbit otomatis dan tersimpan pada acara ini di
                portofolio pribadi Anda.
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
