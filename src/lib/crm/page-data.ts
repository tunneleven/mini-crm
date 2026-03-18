import { headers } from "next/headers";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type OwnerOption = {
  id: string;
  name: string;
  role: UserRole;
};

export type DealRecord = {
  id: string;
  title: string;
  amount: number | null;
  currency: string;
  closeDate: string | null;
  updatedAt: string;
  owner: OwnerOption | null;
  stage: {
    id: string;
    name: string;
    kind: string;
    position: number;
  };
  companies: Array<{
    id: string;
    name: string;
    domain: string | null;
    isPrimary: boolean;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    email: string | null;
  }>;
};

export type DealBoardStage = {
  id: string;
  name: string;
  kind: string;
  position: number;
  dealCount: number;
  totalValue: number;
  deals: DealRecord[];
};

export type DealBoardPageData = {
  pipeline: {
    id: string;
    name: string;
  } | null;
  stages: DealBoardStage[];
  owners: OwnerOption[];
  summary: {
    openDealCount: number;
    totalPipelineValue: number;
    activeStageCount: number;
  };
};

export type DealDetailPageData = {
  deal: DealRecord & {
    pipeline: {
      id: string;
      name: string;
    };
  };
  stageOptions: Array<{
    id: string;
    name: string;
    kind: string;
    position: number;
  }>;
  ownerOptions: OwnerOption[];
};

type WorkspaceRenderContext = {
  workspaceId: string;
  userId: string;
};

function formatFullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function serializeOwner(
  owner:
    | {
        id: string;
        name: string;
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
    role: owner.role,
  };
}

function serializeDealRecord(deal: {
  id: string;
  title: string;
  amount: unknown;
  currency: string;
  closeDate: Date | null;
  updatedAt: Date;
  owner:
    | {
        id: string;
        name: string;
        role: UserRole;
      }
    | null;
  stage: {
    id: string;
    name: string;
    kind: string;
    position: number;
  };
  companies: Array<{
    isPrimary: boolean;
    company: {
      id: string;
      name: string;
      domain: string | null;
    };
  }>;
  contacts: Array<{
    contact: {
      id: string;
      firstName: string;
      lastName: string | null;
      email: string | null;
    };
  }>;
}): DealRecord {
  return {
    id: deal.id,
    title: deal.title,
    amount: deal.amount ? Number(deal.amount) : null,
    currency: deal.currency,
    closeDate: deal.closeDate?.toISOString() ?? null,
    updatedAt: deal.updatedAt.toISOString(),
    owner: serializeOwner(deal.owner),
    stage: deal.stage,
    companies: deal.companies.map((link) => ({
      id: link.company.id,
      name: link.company.name,
      domain: link.company.domain,
      isPrimary: link.isPrimary,
    })),
    contacts: deal.contacts.map((link) => ({
      id: link.contact.id,
      name: formatFullName(link.contact.firstName, link.contact.lastName),
      email: link.contact.email,
    })),
  };
}

async function getWorkspaceRenderContext(): Promise<WorkspaceRenderContext> {
  const headerStore = await headers();
  const workspaceId = headerStore.get("x-workspace-id") ?? "northstar-labs";
  const userId = headerStore.get("x-user-id") ?? "kira-sloan";

  return {
    workspaceId,
    userId,
  };
}

async function getWorkspaceOwners(workspaceId: string) {
  return prisma.user.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getDealBoardPageData(): Promise<DealBoardPageData> {
  const context = await getWorkspaceRenderContext();

  const [owners, pipeline] = await Promise.all([
    getWorkspaceOwners(context.workspaceId),
    prisma.pipeline.findFirst({
      where: {
        workspaceId: context.workspaceId,
      },
      include: {
        stages: {
          orderBy: {
            position: "asc",
          },
          include: {
            deals: {
              where: {
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
                stage: {
                  select: {
                    id: true,
                    name: true,
                    kind: true,
                    position: true,
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
              orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
            },
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!pipeline) {
    return {
      pipeline: null,
      stages: [],
      owners,
      summary: {
        openDealCount: 0,
        totalPipelineValue: 0,
        activeStageCount: 0,
      },
    };
  }

  const stages = pipeline.stages.map((stage) => {
    const deals = stage.deals.map(serializeDealRecord);
    const totalValue = deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

    return {
      id: stage.id,
      name: stage.name,
      kind: stage.kind,
      position: stage.position,
      dealCount: deals.length,
      totalValue,
      deals,
    };
  });

  return {
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
    },
    stages,
    owners,
    summary: {
      openDealCount: stages.reduce((sum, stage) => sum + stage.dealCount, 0),
      totalPipelineValue: stages.reduce((sum, stage) => sum + stage.totalValue, 0),
      activeStageCount: stages.filter((stage) => stage.dealCount > 0).length,
    },
  };
}

export async function getDealDetailPageData(dealId: string): Promise<DealDetailPageData | null> {
  const context = await getWorkspaceRenderContext();

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
        stage: {
          select: {
            id: true,
            name: true,
            kind: true,
            position: true,
          },
        },
        pipeline: {
          select: {
            id: true,
            name: true,
            stages: {
              select: {
                id: true,
                name: true,
                kind: true,
                position: true,
              },
              orderBy: {
                position: "asc",
              },
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

  return {
    deal: {
      ...serializeDealRecord(deal),
      pipeline: {
        id: deal.pipeline.id,
        name: deal.pipeline.name,
      },
    },
    stageOptions: deal.pipeline.stages,
    ownerOptions,
  };
}
