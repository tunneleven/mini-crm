import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
  contact: {
    findMany: vi.fn(),
  },
  company: {
    findMany: vi.fn(),
  },
  deal: {
    findMany: vi.fn(),
  },
  pipeline: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { createContact, listPipelines, searchRecords, updateDealStage } from "@/lib/crm/service";

describe("crm service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  function sessionRequest() {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "kira-sloan",
      name: "Kira Sloan",
      role: "ADMIN",
    });

    return {
      headers: new Headers({
        "x-workspace-id": "northstar-labs",
        "x-user-id": "kira-sloan",
      }),
    } as never;
  }

  it("updates a deal stage and records a stage-change activity", async () => {
    const request = sessionRequest();

    const tx = {
      deal: {
        findFirst: vi.fn().mockResolvedValue({
          id: "deal-1",
          workspaceId: "northstar-labs",
          title: "Northline rollout",
          amount: 12000,
          currency: "USD",
          closeDate: null,
          archivedAt: null,
          createdAt: new Date("2026-03-18T00:00:00.000Z"),
          updatedAt: new Date("2026-03-18T12:00:00.000Z"),
          owner: {
            id: "kira-sloan",
            name: "Kira Sloan",
            email: "kira@northstarlabs.io",
            role: "ADMIN",
          },
          pipeline: {
            id: "pipeline-sales",
            name: "Sales Pipeline",
            isDefault: true,
          },
          stage: {
            id: "stage-qualified",
            name: "Qualified",
            kind: "QUALIFIED",
            position: 1,
          },
          contacts: [],
          companies: [],
        }),
        update: vi.fn().mockResolvedValue({
          id: "deal-1",
          workspaceId: "northstar-labs",
          title: "Northline rollout",
          amount: 12000,
          currency: "USD",
          closeDate: null,
          archivedAt: null,
          createdAt: new Date("2026-03-18T00:00:00.000Z"),
          updatedAt: new Date("2026-03-18T12:30:00.000Z"),
          owner: {
            id: "kira-sloan",
            name: "Kira Sloan",
            email: "kira@northstarlabs.io",
            role: "ADMIN",
          },
          pipeline: {
            id: "pipeline-sales",
            name: "Sales Pipeline",
            isDefault: true,
          },
          stage: {
            id: "stage-proposal",
            name: "Proposal",
            kind: "PROPOSAL",
            position: 2,
          },
          contacts: [],
          companies: [],
        }),
      },
      pipelineStage: {
        findFirst: vi.fn().mockResolvedValue({
          id: "stage-proposal",
          name: "Proposal",
          pipelineId: "pipeline-sales",
        }),
      },
      activity: {
        create: vi.fn().mockResolvedValue({
          id: "activity-1",
        }),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => {
      return callback(tx);
    });

    const result = await updateDealStage(request, "deal-1", {
      stageId: "stage-proposal",
    });

    expect(result.stage).toMatchObject({
      id: "stage-proposal",
      name: "Proposal",
    });
    expect(tx.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dealId: "deal-1",
          summary: "Stage moved from Qualified to Proposal",
        }),
      }),
    );
  });

  it("creates a contact inside the current workspace", async () => {
    const request = sessionRequest();
    const tx = {
      user: {
        findFirst: vi.fn(),
      },
      company: {
        findMany: vi.fn(),
      },
      contact: {
        create: vi.fn().mockResolvedValue({
          id: "contact-1",
          workspaceId: "northstar-labs",
          firstName: "Ari",
          lastName: "Mendoza",
          email: "ari@northline.health",
          phone: null,
          title: "Head of Ops",
          archivedAt: null,
          createdAt: new Date("2026-03-18T00:00:00.000Z"),
          updatedAt: new Date("2026-03-18T12:00:00.000Z"),
          owner: null,
          companyLinks: [],
        }),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => {
      return callback(tx);
    });

    const result = await createContact(request, {
      firstName: "Ari",
      lastName: "Mendoza",
      email: "ari@northline.health",
      phone: null,
      title: "Head of Ops",
      ownerId: null,
      companyIds: [],
    });

    expect(result).toMatchObject({
      workspaceId: "northstar-labs",
      fullName: "Ari Mendoza",
      email: "ari@northline.health",
    });
    expect(tx.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: "northstar-labs",
          normalizedEmail: "ari@northline.health",
        }),
      }),
    );
  });

  it("lists pipeline stages with deal counts for the current workspace", async () => {
    const request = sessionRequest();
    mockPrisma.pipeline.findMany.mockResolvedValue([
      {
        id: "pipeline-sales",
        name: "Sales Pipeline",
        isDefault: true,
        stages: [
          {
            id: "stage-lead",
            name: "Lead",
            kind: "LEAD",
            position: 0,
            _count: {
              deals: 3,
            },
          },
        ],
      },
    ]);

    const result = await listPipelines(request);

    expect(result.items).toEqual([
      {
        id: "pipeline-sales",
        name: "Sales Pipeline",
        isDefault: true,
        stages: [
          {
            id: "stage-lead",
            name: "Lead",
            kind: "LEAD",
            position: 0,
            dealCount: 3,
          },
        ],
      },
    ]);
  });

  it("returns merged search results scoped to the actor workspace", async () => {
    const request = sessionRequest();
    mockPrisma.contact.findMany.mockResolvedValue([
      {
        id: "contact-1",
        firstName: "Ari",
        lastName: "Mendoza",
        email: "ari@northline.health",
        title: "Head of Ops",
      },
    ]);
    mockPrisma.company.findMany.mockResolvedValue([
      {
        id: "company-1",
        name: "Northline Health",
        domain: "northline.health",
        industry: "Healthcare",
      },
    ]);
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        title: "Northline rollout",
        amount: 12000,
        currency: "USD",
        stage: {
          name: "Proposal",
        },
      },
    ]);

    const result = await searchRecords(request, { q: "north", limit: 5 });

    expect(result.actor).toMatchObject({
      id: "kira-sloan",
      name: "Kira Sloan",
    });
    expect(result.results).toEqual([
      expect.objectContaining({ entity: "contact", href: "/contacts/contact-1" }),
      expect.objectContaining({ entity: "company", href: "/companies/company-1" }),
      expect.objectContaining({ entity: "deal", href: "/deals/deal-1" }),
    ]);
  });
});
