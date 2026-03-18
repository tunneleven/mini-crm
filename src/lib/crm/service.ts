import { ActivityType, Prisma, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

import type {
  CollectionQueryInput,
  CompanyCreateInput,
  CompanyUpdateInput,
  ContactCreateInput,
  ContactUpdateInput,
  DealCreateInput,
  DealStageUpdateInput,
  DealUpdateInput,
  SearchQueryInput,
} from "@/lib/crm/schemas";

const contactInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
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
} satisfies Prisma.ContactInclude;

const companyInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
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
        include: {
          stage: {
            select: {
              id: true,
              name: true,
              kind: true,
            },
          },
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { deal: { updatedAt: "desc" } }],
  },
} satisfies Prisma.CompanyInclude;

const dealInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  pipeline: {
    select: {
      id: true,
      name: true,
      isDefault: true,
    },
  },
  stage: {
    select: {
      id: true,
      name: true,
      kind: true,
      position: true,
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
        },
      },
    },
    orderBy: {
      contact: {
        firstName: "asc",
      },
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
} satisfies Prisma.DealInclude;

type WorkspaceContext = {
  workspaceId: string;
  userId: string;
  userName: string;
  role: UserRole;
};

function uniqueIds(input?: Array<string | null | undefined>) {
  return [...new Set((input ?? []).filter((value): value is string => Boolean(value)))];
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function formatFullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function serializeOwner(
  owner:
    | {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      }
    | null
    | undefined,
) {
  if (!owner) {
    return null;
  }

  return {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    role: owner.role,
  };
}

function serializeContact(contact: Prisma.ContactGetPayload<{ include: typeof contactInclude }>) {
  return {
    id: contact.id,
    workspaceId: contact.workspaceId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    fullName: formatFullName(contact.firstName, contact.lastName),
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    archivedAt: contact.archivedAt?.toISOString() ?? null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
    owner: serializeOwner(contact.owner),
    companies: contact.companyLinks.map((link) => ({
      id: link.company.id,
      name: link.company.name,
      domain: link.company.domain,
      isPrimary: link.isPrimary,
    })),
  };
}

function serializeCompany(company: Prisma.CompanyGetPayload<{ include: typeof companyInclude }>) {
  return {
    id: company.id,
    workspaceId: company.workspaceId,
    name: company.name,
    domain: company.domain,
    industry: company.industry,
    website: company.website,
    archivedAt: company.archivedAt?.toISOString() ?? null,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    owner: serializeOwner(company.owner),
    contacts: company.contacts.map((link) => ({
      id: link.contact.id,
      name: formatFullName(link.contact.firstName, link.contact.lastName),
      email: link.contact.email,
      title: link.contact.title,
      isPrimary: link.isPrimary,
    })),
    deals: company.deals.map((link) => ({
      id: link.deal.id,
      title: link.deal.title,
      stage: link.deal.stage.name,
      stageKind: link.deal.stage.kind,
      isPrimary: link.isPrimary,
    })),
  };
}

function serializeDeal(deal: Prisma.DealGetPayload<{ include: typeof dealInclude }>) {
  return {
    id: deal.id,
    workspaceId: deal.workspaceId,
    title: deal.title,
    amount: deal.amount ? Number(deal.amount) : null,
    currency: deal.currency,
    closeDate: deal.closeDate?.toISOString() ?? null,
    archivedAt: deal.archivedAt?.toISOString() ?? null,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    owner: serializeOwner(deal.owner),
    pipeline: deal.pipeline,
    stage: deal.stage,
    contacts: deal.contacts.map((link) => ({
      id: link.contact.id,
      name: formatFullName(link.contact.firstName, link.contact.lastName),
      email: link.contact.email,
    })),
    companies: deal.companies.map((link) => ({
      id: link.company.id,
      name: link.company.name,
      domain: link.company.domain,
      isPrimary: link.isPrimary,
    })),
  };
}

async function resolveWorkspaceContext(request: NextRequest): Promise<WorkspaceContext> {
  const workspaceId = request.headers.get("x-workspace-id");
  const userId = request.headers.get("x-user-id");

  if (!workspaceId || !userId) {
    throw new ApiError(401, "Workspace session headers are missing.");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Workspace session is invalid.");
  }

  return {
    workspaceId,
    userId: user.id,
    userName: user.name,
    role: user.role,
  };
}

async function ensureOwnerId(tx: Prisma.TransactionClient, workspaceId: string, ownerId?: string | null) {
  if (ownerId === undefined) {
    return undefined;
  }

  if (ownerId === null) {
    return null;
  }

  const owner = await tx.user.findFirst({
    where: {
      id: ownerId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!owner) {
    throw new ApiError(400, `Owner ${ownerId} does not belong to the current workspace.`);
  }

  return owner.id;
}

async function ensureCompanyIds(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  companyIds?: string[],
) {
  if (!companyIds) {
    return undefined;
  }

  const ids = uniqueIds(companyIds);

  if (ids.length === 0) {
    return [];
  }

  const companies = await tx.company.findMany({
    where: {
      id: { in: ids },
      workspaceId,
      archivedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (companies.length !== ids.length) {
    throw new ApiError(400, "One or more companies do not belong to the current workspace.");
  }

  return ids;
}

async function ensureContactIds(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  contactIds?: string[],
) {
  if (!contactIds) {
    return undefined;
  }

  const ids = uniqueIds(contactIds);

  if (ids.length === 0) {
    return [];
  }

  const contacts = await tx.contact.findMany({
    where: {
      id: { in: ids },
      workspaceId,
      archivedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (contacts.length !== ids.length) {
    throw new ApiError(400, "One or more contacts do not belong to the current workspace.");
  }

  return ids;
}

async function findContactOrThrow(tx: Prisma.TransactionClient, workspaceId: string, contactId: string) {
  const contact = await tx.contact.findFirst({
    where: {
      id: contactId,
      workspaceId,
    },
    include: contactInclude,
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  return contact;
}

async function findCompanyOrThrow(tx: Prisma.TransactionClient, workspaceId: string, companyId: string) {
  const company = await tx.company.findFirst({
    where: {
      id: companyId,
      workspaceId,
    },
    include: companyInclude,
  });

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  return company;
}

async function findDealOrThrow(tx: Prisma.TransactionClient, workspaceId: string, dealId: string) {
  const deal = await tx.deal.findFirst({
    where: {
      id: dealId,
      workspaceId,
    },
    include: dealInclude,
  });

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  return deal;
}

async function resolvePipelineAndStage(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  pipelineId?: string | null,
  stageId?: string | null,
) {
  if (stageId) {
    const stage = await tx.pipelineStage.findFirst({
      where: {
        id: stageId,
        pipeline: {
          workspaceId,
        },
      },
      include: {
        pipeline: {
          include: {
            stages: {
              orderBy: {
                position: "asc",
              },
            },
          },
        },
      },
    });

    if (!stage) {
      throw new ApiError(400, "Stage does not belong to the current workspace.");
    }

    if (pipelineId && stage.pipelineId !== pipelineId) {
      throw new ApiError(400, "Stage does not belong to the selected pipeline.");
    }

    return {
      pipelineId: stage.pipelineId,
      stageId: stage.id,
    };
  }

  const pipeline = await tx.pipeline.findFirst({
    where: pipelineId
      ? {
          id: pipelineId,
          workspaceId,
        }
      : {
          workspaceId,
          isDefault: true,
        },
    include: {
      stages: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!pipeline && pipelineId) {
    throw new ApiError(400, "Pipeline does not belong to the current workspace.");
  }

  const resolvedPipeline =
    pipeline ??
    (await tx.pipeline.findFirst({
      where: {
        workspaceId,
      },
      include: {
        stages: {
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    }));

  if (!resolvedPipeline) {
    throw new ApiError(400, "No pipeline exists for the current workspace.");
  }

  const firstStage = resolvedPipeline.stages[0];

  if (!firstStage) {
    throw new ApiError(400, "Selected pipeline has no stages.");
  }

  return {
    pipelineId: resolvedPipeline.id,
    stageId: firstStage.id,
  };
}

export async function listContacts(request: NextRequest, input: CollectionQueryInput) {
  const context = await resolveWorkspaceContext(request);
  const query = input.q?.trim();

  const contacts = await prisma.contact.findMany({
    where: {
      workspaceId: context.workspaceId,
      archivedAt: input.includeArchived ? undefined : null,
      ...(query
        ? {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: contactInclude,
    orderBy: [{ updatedAt: "desc" }, { firstName: "asc" }],
    take: input.limit,
  });

  return {
    items: contacts.map(serializeContact),
  };
}

export async function createContact(request: NextRequest, input: ContactCreateInput) {
  const context = await resolveWorkspaceContext(request);

  return prisma.$transaction(async (tx) => {
    const ownerId = await ensureOwnerId(tx, context.workspaceId, input.ownerId);
    const companyIds = await ensureCompanyIds(tx, context.workspaceId, input.companyIds);

    const contact = await tx.contact.create({
      data: {
        workspaceId: context.workspaceId,
        ownerId: ownerId ?? undefined,
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        email: input.email ?? null,
        normalizedEmail: normalizeEmail(input.email),
        phone: input.phone ?? null,
        title: input.title ?? null,
        companyLinks:
          companyIds !== undefined
            ? {
                create: companyIds.map((companyId, index) => ({
                  companyId,
                  isPrimary: index === 0,
                })),
              }
            : undefined,
      },
      include: contactInclude,
    });

    return serializeContact(contact);
  });
}

export async function getContact(request: NextRequest, contactId: string) {
  const context = await resolveWorkspaceContext(request);
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      workspaceId: context.workspaceId,
    },
    include: contactInclude,
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  return serializeContact(contact);
}

export async function updateContact(
  request: NextRequest,
  contactId: string,
  input: ContactUpdateInput,
) {
  const context = await resolveWorkspaceContext(request);

  return prisma.$transaction(async (tx) => {
    await findContactOrThrow(tx, context.workspaceId, contactId);

    const ownerId = await ensureOwnerId(tx, context.workspaceId, input.ownerId);
    const companyIds = await ensureCompanyIds(tx, context.workspaceId, input.companyIds);

    const contact = await tx.contact.update({
      where: {
        id: contactId,
      },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.email !== undefined
          ? {
              email: input.email,
              normalizedEmail: normalizeEmail(input.email),
            }
          : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(ownerId !== undefined ? { ownerId } : {}),
        ...(companyIds !== undefined
          ? {
              companyLinks: {
                deleteMany: {},
                create: companyIds.map((companyId, index) => ({
                  companyId,
                  isPrimary: index === 0,
                })),
              },
            }
          : {}),
      },
      include: contactInclude,
    });

    return serializeContact(contact);
  });
}

export async function archiveContact(request: NextRequest, contactId: string) {
  const context = await resolveWorkspaceContext(request);
  const contact = await prisma.contact.updateMany({
    where: {
      id: contactId,
      workspaceId: context.workspaceId,
      archivedAt: null,
    },
    data: {
      archivedAt: new Date(),
    },
  });

  if (contact.count === 0) {
    throw new ApiError(404, "Contact not found.");
  }

  return {
    ok: true,
  };
}

export async function listCompanies(request: NextRequest, input: CollectionQueryInput) {
  const context = await resolveWorkspaceContext(request);
  const query = input.q?.trim();

  const companies = await prisma.company.findMany({
    where: {
      workspaceId: context.workspaceId,
      archivedAt: input.includeArchived ? undefined : null,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { domain: { contains: query, mode: "insensitive" } },
              { industry: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: companyInclude,
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: input.limit,
  });

  return {
    items: companies.map(serializeCompany),
  };
}

export async function createCompany(request: NextRequest, input: CompanyCreateInput) {
  const context = await resolveWorkspaceContext(request);

  return prisma.$transaction(async (tx) => {
    const ownerId = await ensureOwnerId(tx, context.workspaceId, input.ownerId);
    const contactIds = await ensureContactIds(tx, context.workspaceId, input.contactIds);

    if (input.primaryContactId && !contactIds?.includes(input.primaryContactId)) {
      throw new ApiError(400, "Primary contact must be part of the linked contact set.");
    }

    const company = await tx.company.create({
      data: {
        workspaceId: context.workspaceId,
        ownerId: ownerId ?? undefined,
        name: input.name,
        domain: input.domain ?? null,
        industry: input.industry ?? null,
        website: input.website ?? null,
        contacts:
          contactIds !== undefined
            ? {
                create: contactIds.map((contactId) => ({
                  contactId,
                  isPrimary: contactId === input.primaryContactId,
                })),
              }
            : undefined,
      },
      include: companyInclude,
    });

    return serializeCompany(company);
  });
}

export async function getCompany(request: NextRequest, companyId: string) {
  const context = await resolveWorkspaceContext(request);
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      workspaceId: context.workspaceId,
    },
    include: companyInclude,
  });

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  return serializeCompany(company);
}

export async function updateCompany(
  request: NextRequest,
  companyId: string,
  input: CompanyUpdateInput,
) {
  const context = await resolveWorkspaceContext(request);

  return prisma.$transaction(async (tx) => {
    await findCompanyOrThrow(tx, context.workspaceId, companyId);

    const ownerId = await ensureOwnerId(tx, context.workspaceId, input.ownerId);
    const contactIds = await ensureContactIds(tx, context.workspaceId, input.contactIds);

    if (input.primaryContactId && !contactIds?.includes(input.primaryContactId)) {
      throw new ApiError(400, "Primary contact must be part of the linked contact set.");
    }

    const company = await tx.company.update({
      where: {
        id: companyId,
      },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.domain !== undefined ? { domain: input.domain } : {}),
        ...(input.industry !== undefined ? { industry: input.industry } : {}),
        ...(input.website !== undefined ? { website: input.website } : {}),
        ...(ownerId !== undefined ? { ownerId } : {}),
        ...(contactIds !== undefined
          ? {
              contacts: {
                deleteMany: {},
                create: contactIds.map((contactId) => ({
                  contactId,
                  isPrimary: contactId === input.primaryContactId,
                })),
              },
            }
          : {}),
      },
      include: companyInclude,
    });

    return serializeCompany(company);
  });
}

export async function archiveCompany(request: NextRequest, companyId: string) {
  const context = await resolveWorkspaceContext(request);
  const company = await prisma.company.updateMany({
    where: {
      id: companyId,
      workspaceId: context.workspaceId,
      archivedAt: null,
    },
    data: {
      archivedAt: new Date(),
    },
  });

  if (company.count === 0) {
    throw new ApiError(404, "Company not found.");
  }

  return {
    ok: true,
  };
}

export async function listDeals(request: NextRequest, input: CollectionQueryInput) {
  const context = await resolveWorkspaceContext(request);
  const query = input.q?.trim();

  const deals = await prisma.deal.findMany({
    where: {
      workspaceId: context.workspaceId,
      archivedAt: input.includeArchived ? undefined : null,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { companies: { some: { company: { name: { contains: query, mode: "insensitive" } } } } },
              { contacts: { some: { contact: { email: { contains: query, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
    include: dealInclude,
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: input.limit,
  });

  return {
    items: deals.map(serializeDeal),
  };
}

export async function createDeal(request: NextRequest, input: DealCreateInput) {
  const context = await resolveWorkspaceContext(request);

  return prisma.$transaction(async (tx) => {
    const ownerId = await ensureOwnerId(tx, context.workspaceId, input.ownerId);
    const companyIds = await ensureCompanyIds(tx, context.workspaceId, input.companyIds);
    const contactIds = await ensureContactIds(tx, context.workspaceId, input.contactIds);

    if (input.primaryCompanyId && !companyIds?.includes(input.primaryCompanyId)) {
      throw new ApiError(400, "Primary company must be part of the linked company set.");
    }

    const stage = await resolvePipelineAndStage(
      tx,
      context.workspaceId,
      input.pipelineId,
      input.stageId,
    );

    const deal = await tx.deal.create({
      data: {
        workspaceId: context.workspaceId,
        ownerId: ownerId ?? undefined,
        pipelineId: stage.pipelineId,
        stageId: stage.stageId,
        title: input.title,
        amount: input.amount ?? null,
        currency: input.currency.toUpperCase(),
        closeDate: input.closeDate ? new Date(input.closeDate) : null,
        companies:
          companyIds !== undefined
            ? {
                create: companyIds.map((companyId) => ({
                  companyId,
                  isPrimary: companyId === input.primaryCompanyId,
                })),
              }
            : undefined,
        contacts:
          contactIds !== undefined
            ? {
                create: contactIds.map((contactId) => ({
                  contactId,
                })),
              }
            : undefined,
      },
      include: dealInclude,
    });

    return serializeDeal(deal);
  });
}

export async function getDeal(request: NextRequest, dealId: string) {
  const context = await resolveWorkspaceContext(request);
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      workspaceId: context.workspaceId,
    },
    include: dealInclude,
  });

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  return serializeDeal(deal);
}

export async function updateDeal(request: NextRequest, dealId: string, input: DealUpdateInput) {
  const context = await resolveWorkspaceContext(request);

  return prisma.$transaction(async (tx) => {
    await findDealOrThrow(tx, context.workspaceId, dealId);

    const ownerId = await ensureOwnerId(tx, context.workspaceId, input.ownerId);
    const companyIds = await ensureCompanyIds(tx, context.workspaceId, input.companyIds);
    const contactIds = await ensureContactIds(tx, context.workspaceId, input.contactIds);

    if (input.primaryCompanyId && !companyIds?.includes(input.primaryCompanyId)) {
      throw new ApiError(400, "Primary company must be part of the linked company set.");
    }

    const deal = await tx.deal.update({
      where: {
        id: dealId,
      },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency.toUpperCase() } : {}),
        ...(input.closeDate !== undefined
          ? {
              closeDate: input.closeDate ? new Date(input.closeDate) : null,
            }
          : {}),
        ...(ownerId !== undefined ? { ownerId } : {}),
        ...(companyIds !== undefined
          ? {
              companies: {
                deleteMany: {},
                create: companyIds.map((companyId) => ({
                  companyId,
                  isPrimary: companyId === input.primaryCompanyId,
                })),
              },
            }
          : {}),
        ...(contactIds !== undefined
          ? {
              contacts: {
                deleteMany: {},
                create: contactIds.map((contactId) => ({
                  contactId,
                })),
              },
            }
          : {}),
      },
      include: dealInclude,
    });

    return serializeDeal(deal);
  });
}

export async function archiveDeal(request: NextRequest, dealId: string) {
  const context = await resolveWorkspaceContext(request);
  const deal = await prisma.deal.updateMany({
    where: {
      id: dealId,
      workspaceId: context.workspaceId,
      archivedAt: null,
    },
    data: {
      archivedAt: new Date(),
    },
  });

  if (deal.count === 0) {
    throw new ApiError(404, "Deal not found.");
  }

  return {
    ok: true,
  };
}

export async function updateDealStage(
  request: NextRequest,
  dealId: string,
  input: DealStageUpdateInput,
) {
  const context = await resolveWorkspaceContext(request);

  return prisma.$transaction(async (tx) => {
    const existingDeal = await findDealOrThrow(tx, context.workspaceId, dealId);

    const nextStage = await tx.pipelineStage.findFirst({
      where: {
        id: input.stageId,
        pipeline: {
          workspaceId: context.workspaceId,
        },
      },
      select: {
        id: true,
        name: true,
        pipelineId: true,
      },
    });

    if (!nextStage) {
      throw new ApiError(400, "Stage does not belong to the current workspace.");
    }

    if (nextStage.pipelineId !== existingDeal.pipeline.id) {
      throw new ApiError(400, "Stage does not belong to the deal pipeline.");
    }

    const deal = await tx.deal.update({
      where: {
        id: dealId,
      },
      data: {
        stageId: nextStage.id,
      },
      include: dealInclude,
    });

    if (existingDeal.stage.id !== nextStage.id) {
      await tx.activity.create({
        data: {
          workspaceId: context.workspaceId,
          dealId,
          type: ActivityType.STAGE_CHANGE,
          summary: `Stage moved from ${existingDeal.stage.name} to ${nextStage.name}`,
        },
      });
    }

    return serializeDeal(deal);
  });
}

export async function searchRecords(request: NextRequest, input: SearchQueryInput) {
  const context = await resolveWorkspaceContext(request);
  const query = input.q.trim();

  const [contacts, companies, deals] = await Promise.all([
    prisma.contact.findMany({
      where: {
        workspaceId: context.workspaceId,
        archivedAt: null,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: input.limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
      },
    }),
    prisma.company.findMany({
      where: {
        workspaceId: context.workspaceId,
        archivedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { domain: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: input.limit,
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
      },
    }),
    prisma.deal.findMany({
      where: {
        workspaceId: context.workspaceId,
        archivedAt: null,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { companies: { some: { company: { name: { contains: query, mode: "insensitive" } } } } },
          { contacts: { some: { contact: { email: { contains: query, mode: "insensitive" } } } } },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: input.limit,
      select: {
        id: true,
        title: true,
        amount: true,
        currency: true,
        stage: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    query,
    actor: {
      id: context.userId,
      name: context.userName,
      role: context.role,
    },
    results: [
      ...contacts.map((contact) => ({
        id: contact.id,
        entity: "contact" as const,
        title: formatFullName(contact.firstName, contact.lastName),
        subtitle: contact.title,
        meta: contact.email,
        href: `/contacts/${contact.id}`,
      })),
      ...companies.map((company) => ({
        id: company.id,
        entity: "company" as const,
        title: company.name,
        subtitle: company.industry,
        meta: company.domain,
        href: `/companies/${company.id}`,
      })),
      ...deals.map((deal) => ({
        id: deal.id,
        entity: "deal" as const,
        title: deal.title,
        subtitle: deal.stage.name,
        meta: deal.amount ? `${Number(deal.amount)} ${deal.currency}` : deal.currency,
        href: `/deals/${deal.id}`,
      })),
    ],
  };
}
