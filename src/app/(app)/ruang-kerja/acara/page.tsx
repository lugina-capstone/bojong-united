import { CalendarPlusIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  hrefWith,
  pageOf,
  param,
  type SearchParams,
} from "@/app/(app)/_components/href";
import {
  SearchParamInput,
  SearchParamSelect,
} from "@/app/(app)/_components/list-controls";
import { ListFooter } from "@/app/(app)/_components/list-footer";
import { ManageEventCard } from "@/app/(app)/ruang-kerja/acara/_components/manage-event-card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { Prisma } from "@/generated/prisma/client";
import type { EventStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/teacher-access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Acara Saya" };

const PATH = "/ruang-kerja/acara";
const PAGE_SIZE = 6;

const TABS: {
  value: string;
  label: string;
  noun: string;
  status: EventStatus[];
}[] = [
  {
    value: "terbit",
    label: "Terbit",
    noun: "acara terbit",
    status: ["PUBLISHED", "CLOSED"],
  },
  { value: "draf", label: "Draf", noun: "draf", status: ["DRAFT"] },
  {
    value: "arsip",
    label: "Arsip",
    noun: "acara diarsipkan",
    status: ["ARCHIVED"],
  },
];

const PHASES = [
  { value: "semua", label: "Semua status" },
  { value: "berlangsung", label: "Berlangsung" },
  { value: "belum", label: "Belum dimulai" },
  { value: "berakhir", label: "Berakhir" },
];

function phaseWhere(phase: string, now: Date): Prisma.EventWhereInput {
  switch (phase) {
    case "berlangsung":
      return {
        status: "PUBLISHED",
        startsAt: { lte: now },
        endsAt: { gt: now },
      };
    case "belum":
      return { status: "PUBLISHED", startsAt: { gt: now } };
    case "berakhir":
      return {
        OR: [
          { status: "CLOSED" },
          { status: "PUBLISHED", endsAt: { lte: now } },
        ],
      };
    default:
      return {};
  }
}

export default async function MyEventsPage({
  searchParams,
}: PageProps<"/ruang-kerja/acara">) {
  const { user, organizationId } = await requireTeacher();
  const params = (await searchParams) as SearchParams;
  const tab = TABS.find((t) => t.value === param(params, "tab")) ?? TABS[0]!;
  const q = param(params, "q");
  const phase = tab.value === "terbit" ? param(params, "status") : "";
  const page = pageOf(params);
  const now = new Date();

  const mine: Prisma.EventWhereInput = {
    organizationId,
    creatorId: user.id,
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };
  const where: Prisma.EventWhereInput = {
    AND: [mine, { status: { in: tab.status } }, phaseWhere(phase, now)],
  };
  const published = { AND: [mine, { status: { in: TABS[0]!.status } }] };

  const [counts, phaseCounts, events, total] = await Promise.all([
    Promise.all(
      TABS.map((t) =>
        db.event.count({
          where: { AND: [mine, { status: { in: t.status } }] },
        }),
      ),
    ),
    Promise.all(
      ["berlangsung", "belum", "berakhir"].map((p) =>
        db.event.count({ where: { AND: [published, phaseWhere(p, now)] } }),
      ),
    ),
    db.event.findMany({
      where,
      orderBy:
        tab.value === "draf"
          ? [{ updatedAt: "desc" }]
          : [{ startsAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        updatedAt: true,
        draftStep: true,
        participantType: true,
        field: { select: { name: true } },
        _count: { select: { milestones: true, enrollments: true } },
      },
    }),
    db.event.count({ where }),
  ]);

  const createButton = (
    <Link href="/ruang-kerja/acara/baru" className={buttonVariants()}>
      <PlusIcon aria-hidden="true" />
      Buat acara
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Ruang belajar Anda"
        title="Acara Saya"
        description="Rancang perjalanan belajar. Kelola setiap acara dari satu tempat."
        actions={createButton}
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <nav
          aria-label="Jenis acara"
          className="inline-flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.5"
        >
          {TABS.map((t, i) => {
            const active = t.value === tab.value;
            return (
              <Link
                key={t.value}
                href={hrefWith(PATH, params, {
                  tab: t.value === "terbit" ? null : t.value,
                  status: null,
                  page: null,
                })}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center rounded-md px-4 py-2 text-small-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-card focus-visible:shadow-focus-ring",
                  active &&
                    "bg-card text-small-strong text-primary-500 shadow-xs",
                )}
              >
                {t.label} · {counts[i]}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1">
          <SearchParamInput
            label="Cari acara"
            placeholder="Cari judul acara…"
          />
        </div>
        {tab.value === "terbit" && (
          <div className="lg:w-52">
            <SearchParamSelect
              name="status"
              label="Filter status"
              options={PHASES}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-strong text-foreground">
          {total} {tab.noun}
        </p>
        {tab.value === "terbit" && (
          <p className="text-small text-muted-foreground">
            {phaseCounts[0]} berlangsung · {phaseCounts[1]} belum dimulai ·{" "}
            {phaseCounts[2]} berakhir
          </p>
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarPlusIcon}
          title={
            q || phase
              ? "Tidak ada acara yang cocok"
              : tab.value === "draf"
                ? "Belum ada draf"
                : tab.value === "arsip"
                  ? "Belum ada acara diarsipkan"
                  : "Belum ada acara terbit"
          }
          description={
            q || phase
              ? "Coba kata kunci atau filter lain."
              : "Buat acara pertama Anda dan susun milestone untuk peserta."
          }
          action={
            q || phase || tab.value === "arsip" ? undefined : createButton
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {events.map((event, index) => (
            <ManageEventCard
              key={event.id}
              number={(page - 1) * PAGE_SIZE + index + 1}
              event={{
                id: event.id,
                title: event.title,
                description: event.description ?? "",
                status: event.status,
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                updatedAt: event.updatedAt,
                draftStep: event.draftStep,
                isTeam: event.participantType === "TEAM",
                field: event.field?.name ?? null,
                milestoneCount: event._count.milestones,
                participantCount: event._count.enrollments,
              }}
            />
          ))}
        </div>
      )}
      <div className="border-t border-border pt-4">
        <ListFooter
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          noun="acara"
          hrefFor={(p) => hrefWith(PATH, params, { page: p })}
        />
      </div>
    </div>
  );
}
