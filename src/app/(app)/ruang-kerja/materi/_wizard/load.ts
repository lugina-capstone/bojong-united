import "server-only";

import { db } from "@/lib/db";
import { materialCover } from "@/lib/material-rules";
import { logoUrlOf } from "@/lib/organization-access";
import { roleLabels } from "@/lib/rbac";

export type WizardSection = {
  key: string;
  id?: string;
  title: string;
  content: string;
  mode: "file" | "link" | "text";
  fileId: string | null;
  file: { name: string; size: number; contentType: string } | null;
  link: string;
  durationMinutes: number | null;
};

export type MaterialWizardData = Awaited<ReturnType<typeof loadMaterialWizard>>;

/** Data wizard materi: draf (jika ada), kategori, dan acara organisasi untuk dilampirkan. */
export async function loadMaterialWizard(input: {
  organizationId: string;
  userId: string;
  userName: string;
  materialId: string | null;
}) {
  const { organizationId } = input;
  const [organization, categories, events, material] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        name: true,
        logo: { select: { key: true, name: true, contentType: true } },
      },
    }),
    db.materialCategory.findMany({
      where: { OR: [{ organizationId }, { organizationId: null }] },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    db.event.findMany({
      where: { organizationId, status: { in: ["DRAFT", "PUBLISHED"] } },
      orderBy: [{ status: "desc" }, { startsAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        creator: {
          select: { name: true, membership: { select: { role: true } } },
        },
        _count: { select: { enrollments: true } },
      },
    }),
    input.materialId
      ? db.material.findFirst({
          where: {
            id: input.materialId,
            organizationId,
            trainerId: input.userId,
          },
          include: {
            events: { select: { eventId: true } },
            sections: {
              orderBy: { order: "asc" },
              include: {
                file: { select: { name: true, size: true, contentType: true } },
              },
            },
            _count: { select: { enrollments: true } },
          },
        })
      : null,
  ]);
  if (input.materialId && !material) return null;
  return {
    materialId: material?.id ?? null,
    status: material?.status ?? "DRAFT",
    draftStep: material?.draftStep ?? 1,
    learners: material?._count.enrollments ?? 0,
    trainerName: input.userName,
    organization: {
      name: organization.name,
      logoUrl: await logoUrlOf(organization.logo),
    },
    info: {
      title: material?.title ?? "",
      description: material?.description ?? "",
      outcomes: (material?.outcomes ?? []).join("\n"),
      categoryId: material?.categoryId ?? categories[0]?.id ?? "",
      newCategory: "",
      level: material?.level ?? ("BEGINNER" as const),
      coverColor: materialCover(material?.coverColor ?? "blue"),
    },
    sections: (material?.sections ?? []).map((s): WizardSection => ({
      key: s.id,
      id: s.id,
      title: s.title,
      content: s.content ?? "",
      mode: s.fileId ? "file" : s.link ? "link" : "text",
      fileId: s.fileId,
      file: s.file
        ? {
            name: s.file.name,
            size: s.file.size,
            contentType: s.file.contentType,
          }
        : null,
      link: s.link ?? "",
      durationMinutes: s.durationMinutes,
    })),
    publish: {
      visibility: material?.visibility ?? ("PUBLIC" as const),
      eventIds: material?.events.map((e) => e.eventId) ?? [],
    },
    categories,
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      draft: e.status === "DRAFT",
      creatorName: e.creator.name,
      creatorRole: e.creator.membership
        ? roleLabels[e.creator.membership.role]
        : "",
      participants: e._count.enrollments,
    })),
  };
}
