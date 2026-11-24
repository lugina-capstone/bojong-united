import "server-only";

import { db } from "@/lib/db";
import { publishIssues } from "@/lib/event-publish";
import { logoUrlOf } from "@/lib/organization-access";

export type WizardOption = { id: string; name: string };

export type WizardRubric = {
  id: string;
  title: string;
  description: string | null;
  fieldId: string;
  fieldName: string;
  version: number;
  criteria: {
    name: string;
    description: string | null;
    levels: [string, string, string, string, string];
  }[];
};

export type WizardMilestone = {
  id?: string;
  title: string;
  instructions: string;
  formats: ("PDF" | "IMAGE" | "TEXT" | "LINK")[];
  dueAt: string;
  rubricId: string | null;
  attachments: { id: string; name: string; size: number }[];
};

export type WizardData = {
  eventId: string | null;
  draftStep: number;
  creatorName: string;
  creatorRole: string;
  organization: { name: string; logoUrl: string | null; type: string };
  info: {
    title: string;
    fieldId: string;
    description: string;
    guidelines: string;
    startsAt: string;
    endsAt: string;
    participantType: "INDIVIDUAL" | "TEAM";
    maxTeamMembers: number | null;
    materialIds: string[];
  };
  milestones: WizardMilestone[];
  certificate: {
    kkm: number;
    certificateEnabled: boolean;
    certificateTemplateId: string | null;
    certificateTitle: string;
    certificateIssuer: string;
    certificateSigner: string;
  };
  fields: WizardOption[];
  materials: (WizardOption & { level: string; category: string })[];
  rubrics: WizardRubric[];
  templates: WizardOption[];
  issues: string[];
};

/** Nilai `datetime-local` (WIB) dari Date. */
export function toLocalInput(date: Date | null) {
  if (!date) return "";
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 16);
}

export async function loadWizard(input: {
  organizationId: string;
  userId: string;
  userName: string;
  roleLabel: string;
  eventId: string | null;
}): Promise<WizardData | null> {
  const { organizationId } = input;
  const [organization, fields, materials, rubrics, templates, event] =
    await Promise.all([
      db.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: {
          name: true,
          type: true,
          logo: { select: { key: true, name: true, contentType: true } },
        },
      }),
      db.subjectField.findMany({
        where: { OR: [{ organizationId }, { organizationId: null }] },
        orderBy: [
          { organizationId: { sort: "asc", nulls: "first" } },
          { name: "asc" },
        ],
        select: { id: true, name: true },
      }),
      db.material.findMany({
        where: { organizationId, status: "PUBLISHED" },
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          level: true,
          category: { select: { name: true } },
        },
      }),
      db.rubric.findMany({
        where: { organizationId, archivedAt: null },
        orderBy: { updatedAt: "desc" },
        include: {
          field: { select: { name: true } },
          criteria: { orderBy: { order: "asc" } },
        },
      }),
      db.certificateTemplate.findMany({
        where: { OR: [{ organizationId }, { organizationId: null }] },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      input.eventId
        ? db.event.findFirst({
            where: {
              id: input.eventId,
              organizationId,
              creatorId: input.userId,
              status: "DRAFT",
            },
            include: {
              materials: { select: { materialId: true } },
              milestones: {
                orderBy: { order: "asc" },
                include: {
                  attachments: {
                    include: {
                      file: { select: { id: true, name: true, size: true } },
                    },
                  },
                },
              },
            },
          })
        : null,
    ]);
  if (input.eventId && !event) return null;

  return {
    eventId: event?.id ?? null,
    draftStep: event?.draftStep ?? 1,
    creatorName: input.userName,
    creatorRole: input.roleLabel,
    organization: {
      name: organization.name,
      type: organization.type,
      logoUrl: await logoUrlOf(organization.logo),
    },
    info: {
      title: event?.title ?? "",
      fieldId: event?.fieldId ?? "",
      description: event?.description ?? "",
      guidelines: event?.guidelines ?? "",
      startsAt: toLocalInput(event?.startsAt ?? null),
      endsAt: toLocalInput(event?.endsAt ?? null),
      participantType: event?.participantType ?? "INDIVIDUAL",
      maxTeamMembers: event?.maxTeamMembers ?? null,
      materialIds: event?.materials.map((m) => m.materialId) ?? [],
    },
    milestones:
      event?.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        instructions: m.instructions ?? "",
        formats: m.formats,
        dueAt: toLocalInput(m.dueAt),
        rubricId: m.rubricId,
        attachments: m.attachments.map((a) => a.file),
      })) ?? [],
    certificate: {
      kkm: event?.kkm ?? 75,
      certificateEnabled:
        event && event.draftStep >= 5 ? event.certificateEnabled : true,
      certificateTemplateId:
        event?.certificateTemplateId ?? templates[0]?.id ?? null,
      certificateTitle: event?.certificateTitle ?? "Sertifikat Penyelesaian",
      certificateIssuer: event?.certificateIssuer ?? organization.name,
      certificateSigner: event?.certificateSigner ?? input.userName,
    },
    fields,
    materials: materials.map((m) => ({
      id: m.id,
      name: m.title,
      level: m.level,
      category: m.category.name,
    })),
    rubrics: rubrics.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      fieldId: r.fieldId,
      fieldName: r.field.name,
      version: r.version,
      criteria: r.criteria.map((c) => ({
        name: c.name,
        description: c.description,
        levels: [c.level1, c.level2, c.level3, c.level4, c.level5],
      })),
    })),
    templates,
    issues: event ? await publishIssues(event.id) : [],
  };
}
