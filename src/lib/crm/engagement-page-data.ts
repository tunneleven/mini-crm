import { UserRole } from "@prisma/client";

import { getWorkspaceContextFromServer, getWorkspaceOwners, listTimelineForTarget, listWorkspaceTasks } from "@/lib/crm/activity-service";
import { prisma } from "@/lib/prisma";

type RecordTargetType = "contact" | "company" | "deal";

export type SummaryRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
};

export type EngagementPageData = {
  ownerOptions: Array<{
    id: string;
    name: string;
    role: UserRole;
  }>;
  timeline: Awaited<ReturnType<typeof listTimelineForTarget>>;
  tasks: Awaited<ReturnType<typeof listWorkspaceTasks>>;
  summary: Array<SummaryRecord>;
  record: {
    id: string;
    title: string;
    subtitle: string;
    meta: string;
  };
  target: {
    type: RecordTargetType;
    id: string;
  };
};

function formatFullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export async function getContactEngagementPageData(contactId: string): Promise<EngagementPageData | null> {
  const context = await getWorkspaceContextFromServer();
  const [ownerOptions, contact] = await Promise.all([
    getWorkspaceOwners(context.workspaceId),
    prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId: context.workspaceId,
        archivedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        companyLinks: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { company: { name: "asc" } }],
        },
        dealLinks: {
          include: {
            deal: {
              select: {
                id: true,
                title: true,
                stage: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            deal: {
              updatedAt: "desc",
            },
          },
        },
      },
    }),
  ]);

  if (!contact) {
    return null;
  }

  const target = { type: "contact" as const, id: contact.id };
  const [timeline, tasks] = await Promise.all([
    listTimelineForTarget(context, target),
    listWorkspaceTasks(context, {
      targetType: "contact",
      targetId: contact.id,
      includeCompleted: false,
    }),
  ]);

  return {
    ownerOptions,
    timeline,
    tasks,
    summary: [
      {
        id: "owner",
        title: contact.owner?.name ?? "Unassigned",
        subtitle: "Owner",
        meta: contact.owner?.role ?? "No role",
        href: "/contacts",
      },
      ...contact.companyLinks.map((link) => ({
        id: link.company.id,
        title: link.company.name,
        subtitle: link.isPrimary ? "Primary company" : "Linked company",
        meta: link.company.domain ?? "No domain",
        href: `/companies/${link.company.id}`,
      })),
      ...contact.dealLinks.map((link) => ({
        id: link.deal.id,
        title: link.deal.title,
        subtitle: "Related deal",
        meta: link.deal.stage.name,
        href: `/deals/${link.deal.id}`,
      })),
    ],
    record: {
      id: contact.id,
      title: formatFullName(contact.firstName, contact.lastName),
      subtitle: contact.title ?? "Contact record",
      meta: contact.email ?? "No email",
    },
    target,
  };
}

export async function getCompanyEngagementPageData(companyId: string): Promise<EngagementPageData | null> {
  const context = await getWorkspaceContextFromServer();
  const [ownerOptions, company] = await Promise.all([
    getWorkspaceOwners(context.workspaceId),
    prisma.company.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        archivedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                title: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { contact: { firstName: "asc" } }],
        },
        deals: {
          include: {
            deal: {
              select: {
                id: true,
                title: true,
                stage: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { deal: { updatedAt: "desc" } }],
        },
      },
    }),
  ]);

  if (!company) {
    return null;
  }

  const target = { type: "company" as const, id: company.id };
  const [timeline, tasks] = await Promise.all([
    listTimelineForTarget(context, target),
    listWorkspaceTasks(context, {
      targetType: "company",
      targetId: company.id,
      includeCompleted: false,
    }),
  ]);

  return {
    ownerOptions,
    timeline,
    tasks,
    summary: [
      {
        id: "owner",
        title: company.owner?.name ?? "Unassigned",
        subtitle: "Owner",
        meta: company.owner?.role ?? "No role",
        href: "/companies",
      },
      ...company.contacts.map((link) => ({
        id: link.contact.id,
        title: formatFullName(link.contact.firstName, link.contact.lastName),
        subtitle: link.isPrimary ? "Primary contact" : link.contact.title ?? "Linked contact",
        meta: link.contact.email ?? "No email",
        href: `/contacts/${link.contact.id}`,
      })),
      ...company.deals.map((link) => ({
        id: link.deal.id,
        title: link.deal.title,
        subtitle: "Related deal",
        meta: link.deal.stage.name,
        href: `/deals/${link.deal.id}`,
      })),
    ],
    record: {
      id: company.id,
      title: company.name,
      subtitle: company.industry ?? "Company record",
      meta: company.domain ?? "No domain",
    },
    target,
  };
}

export async function getDealEngagementPageData(dealId: string): Promise<EngagementPageData | null> {
  const context = await getWorkspaceContextFromServer();
  const [ownerOptions, deal] = await Promise.all([
    getWorkspaceOwners(context.workspaceId),
    prisma.deal.findFirst({
      where: {
        id: dealId,
        workspaceId: context.workspaceId,
        archivedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        companies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { company: { name: "asc" } }],
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            contact: {
              firstName: "asc",
            },
          },
        },
      },
    }),
  ]);

  if (!deal) {
    return null;
  }

  const target = { type: "deal" as const, id: deal.id };
  const [timeline, tasks] = await Promise.all([
    listTimelineForTarget(context, target),
    listWorkspaceTasks(context, {
      targetType: "deal",
      targetId: deal.id,
      includeCompleted: false,
    }),
  ]);

  return {
    ownerOptions,
    timeline,
    tasks,
    summary: [
      {
        id: "owner",
        title: deal.owner?.name ?? "Unassigned",
        subtitle: "Owner",
        meta: deal.owner?.role ?? "No role",
        href: "/deals",
      },
      ...deal.companies.map((link) => ({
        id: link.company.id,
        title: link.company.name,
        subtitle: link.isPrimary ? "Primary company" : "Linked company",
        meta: link.company.domain ?? "No domain",
        href: `/companies/${link.company.id}`,
      })),
      ...deal.contacts.map((link) => ({
        id: link.contact.id,
        title: formatFullName(link.contact.firstName, link.contact.lastName),
        subtitle: "Related contact",
        meta: link.contact.email ?? "No email",
        href: `/contacts/${link.contact.id}`,
      })),
    ],
    record: {
      id: deal.id,
      title: deal.title,
      subtitle: deal.stageId,
      meta: deal.currency,
    },
    target,
  };
}

export async function getTaskWorkspacePageData() {
  const context = await getWorkspaceContextFromServer();
  const [owners, tasks] = await Promise.all([
    getWorkspaceOwners(context.workspaceId),
    listWorkspaceTasks(context, { includeCompleted: true }),
  ]);

  const overdueCount = tasks.filter((task) => task.isOverdue).length;
  const doneCount = tasks.filter((task) => task.status === "DONE").length;
  const openCount = tasks.length - doneCount;

  return {
    owners,
    tasks,
    summary: {
      overdueCount,
      doneCount,
      openCount,
    },
    currentUser: {
      id: context.userId,
      name: context.userName,
      role: context.role,
    },
  };
}
