"use server";

import { refresh } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { visibleEventWhere } from "@/lib/event-query";
import {
  canInviteToTeam,
  canRemoveTeamMember,
  eventPhase,
} from "@/lib/event-rules";
import { notify } from "@/lib/notifications";
import { hasStarted, requireParticipant } from "@/lib/participant-access";

export type JoinActionState = { ok?: boolean; error?: string };

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Ikuti acara. Di acara tim, peserta yang mendaftar sendiri menjadi ketua kelompok baru. */
export async function joinEventAction(
  eventId: string,
): Promise<JoinActionState> {
  const user = await requireParticipant();
  const event = await db.event.findFirst({
    where: { id: eventId, ...visibleEventWhere, status: "PUBLISHED" },
  });
  if (!event) return { error: "Acara tidak ditemukan." };
  const phase = eventPhase(event);
  if (phase !== "upcoming" && phase !== "ongoing")
    return { error: "Pendaftaran acara ini sudah ditutup." };
  if (event.participantType === "TEAM" && hasStarted(event))
    return {
      error: "Pendaftaran tim ditutup setelah acara dimulai.",
    };

  const existing = await db.enrollment.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (existing) return { ok: true };

  try {
    if (event.participantType === "TEAM") {
      const pending = await db.teamInvite.findMany({
        where: { inviteeId: user.id, status: "PENDING", team: { eventId } },
        include: { team: { select: { name: true, leaderId: true } } },
      });
      await db.$transaction(async (tx) => {
        const team = await tx.team.create({
          data: { eventId, leaderId: user.id, name: `Kelompok ${user.name}` },
        });
        await tx.enrollment.create({
          data: { eventId, userId: user.id, teamId: team.id },
        });
        await tx.teamInvite.updateMany({
          where: { id: { in: pending.map((i) => i.id) } },
          data: { status: "REJECTED", respondedAt: new Date() },
        });
      });
      for (const invite of pending) {
        await notify([invite.team.leaderId], "team.invite-rejected", {
          userName: user.name,
          teamName: invite.team.name,
          eventId,
        });
      }
    } else {
      await db.enrollment.create({ data: { eventId, userId: user.id } });
    }
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
  refresh();
  return { ok: true };
}

/** Tim yang dipimpin peserta login di acara ini, beserta acaranya. */
async function leaderTeam(teamId: string, userId: string) {
  return db.team.findFirst({
    where: { id: teamId, leaderId: userId },
    include: {
      event: true,
      _count: { select: { members: true } },
    },
  });
}

export type InviteeResult = {
  id: string;
  name: string;
  email: string;
  state: "available" | "in-event" | "invited";
};

/** Cari peserta lain berdasarkan nama untuk diundang ke tim. */
export async function searchInviteesAction(
  teamId: string,
  query: string,
): Promise<InviteeResult[]> {
  const user = await requireParticipant();
  const team = await leaderTeam(teamId, user.id);
  const q = query.trim();
  if (!team || q.length < 2) return [];
  const users = await db.user.findMany({
    where: {
      id: { not: user.id },
      status: "ACTIVE",
      emailVerified: true,
      isAdministrator: false,
      NOT: { membership: { is: { status: "ACTIVE" } } },
      name: { contains: q, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    take: 8,
    select: {
      id: true,
      name: true,
      email: true,
      enrollments: { where: { eventId: team.eventId }, select: { id: true } },
      teamInvitesReceived: {
        where: { teamId, status: "PENDING" },
        select: { id: true },
      },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    state:
      u.enrollments.length > 0
        ? "in-event"
        : u.teamInvitesReceived.length > 0
          ? "invited"
          : "available",
  }));
}

export async function inviteTeamMemberAction(
  teamId: string,
  inviteeId: string,
): Promise<JoinActionState> {
  const user = await requireParticipant();
  const team = await leaderTeam(teamId, user.id);
  if (!team) return { error: "Tim tidak ditemukan." };
  if (hasStarted(team.event))
    return { error: "Anggota tidak bisa diundang setelah acara dimulai." };
  const invitee = await db.user.findFirst({
    where: {
      id: inviteeId,
      status: "ACTIVE",
      emailVerified: true,
      isAdministrator: false,
      NOT: { membership: { is: { status: "ACTIVE" } } },
    },
    select: { id: true },
  });
  if (!invitee || invitee.id === user.id)
    return { error: "Peserta tidak ditemukan." };
  const [inEvent, pending, already] = await Promise.all([
    db.enrollment.count({
      where: { eventId: team.eventId, userId: inviteeId },
    }),
    db.teamInvite.count({ where: { teamId, status: "PENDING" } }),
    db.teamInvite.count({
      where: { teamId, inviteeId, status: "PENDING" },
    }),
  ]);
  if (already) return { error: "Peserta ini sudah diundang." };
  const rule = canInviteToTeam({
    maxMembers: team.event.maxTeamMembers ?? 1,
    joined: team._count.members,
    pending,
    inviteeHasTeam: inEvent > 0,
  });
  if (!rule.allowed) return { error: rule.reason };
  const invite = await db.teamInvite.create({
    data: { teamId, inviteeId, inviterId: user.id },
  });
  await notify([inviteeId], "team.invited", {
    userName: user.name,
    teamName: team.name,
    eventTitle: team.event.title,
    eventId: team.eventId,
    inviteId: invite.id,
  });
  refresh();
  return { ok: true };
}

export async function cancelInviteAction(
  inviteId: string,
): Promise<JoinActionState> {
  const user = await requireParticipant();
  const { count } = await db.teamInvite.updateMany({
    where: { id: inviteId, status: "PENDING", team: { leaderId: user.id } },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });
  if (count === 0) return { error: "Undangan tidak ditemukan." };
  refresh();
  return { ok: true };
}

/** Terima atau tolak undangan tim. */
export async function respondInviteAction(
  inviteId: string,
  accept: boolean,
): Promise<JoinActionState> {
  const user = await requireParticipant();
  const invite = await db.teamInvite.findFirst({
    where: { id: inviteId, inviteeId: user.id, status: "PENDING" },
    include: {
      team: {
        include: { event: true, _count: { select: { members: true } } },
      },
    },
  });
  if (!invite) return { error: "Undangan sudah tidak berlaku." };
  const { team } = invite;
  const payload = {
    userName: user.name,
    teamName: team.name,
    eventId: team.eventId,
  };

  if (!accept) {
    await db.teamInvite.update({
      where: { id: inviteId },
      data: { status: "REJECTED", respondedAt: new Date() },
    });
    await notify([team.leaderId], "team.invite-rejected", payload);
    refresh();
    return { ok: true };
  }

  if (hasStarted(team.event) || team.event.status !== "PUBLISHED")
    return { error: "Acara sudah dimulai, undangan tidak bisa diterima." };
  if (team._count.members >= (team.event.maxTeamMembers ?? 1))
    return { error: "Slot anggota tim sudah penuh." };
  try {
    await db.$transaction([
      db.teamInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      db.enrollment.create({
        data: { eventId: team.eventId, userId: user.id, teamId: team.id },
      }),
      db.teamInvite.updateMany({
        where: {
          inviteeId: user.id,
          status: "PENDING",
          id: { not: inviteId },
          team: { eventId: team.eventId },
        },
        data: { status: "CANCELLED", respondedAt: new Date() },
      }),
    ]);
  } catch (error) {
    if (isUniqueViolation(error))
      return { error: "Anda sudah terdaftar di acara ini." };
    throw error;
  }
  await notify([team.leaderId], "team.invite-accepted", payload);
  refresh();
  return { ok: true };
}

export async function removeTeamMemberAction(
  enrollmentId: string,
): Promise<JoinActionState> {
  const user = await requireParticipant();
  const enrollment = await db.enrollment.findFirst({
    where: { id: enrollmentId, team: { leaderId: user.id } },
    include: { team: { include: { event: true } } },
  });
  if (!enrollment?.team) return { error: "Anggota tidak ditemukan." };
  const rule = canRemoveTeamMember(
    hasStarted(enrollment.team.event),
    enrollment.userId === enrollment.team.leaderId,
  );
  if (!rule.allowed) return { error: rule.reason };
  await db.enrollment.delete({ where: { id: enrollmentId } });
  await notify([enrollment.userId], "team.removed", {
    teamName: enrollment.team.name,
    eventTitle: enrollment.team.event.title,
    eventId: enrollment.team.eventId,
  });
  refresh();
  return { ok: true };
}
