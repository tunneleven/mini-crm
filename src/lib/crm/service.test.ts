import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
  contact: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  company: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  deal: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  pipeline: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  archiveCompany,
  archiveContact,
  archiveDeal,
  createCompany,
  createContact,
  createDeal,
  getCompany,
  getContact,
  getDeal,
  listCompanies,
  listContacts,
  listDeals,
  listPipelines,
  searchRecords,
  updateCompany,
  updateContact,
  updateDeal,
  updateDealStage,
} from "@/lib/crm/service";

function contactRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "contact-1",
    workspaceId: "northstar-labs",
    firstName: "Ari",
    lastName: "Mendoza",
    email: "ari@northline.health",
    phone: "555-0101",
    title: "Head of Ops",
    archivedAt: null,
    createdAt: new Date("2026-03-18T00:00:00.000Z"),
    updatedAt: new Date("2026-03-18T12:00:00.000Z"),
    owner: {
      id: "kira-sloan",
      name: "Kira Sloan",
      email: "kira@northstarlabs.io",
      role: "ADMIN",
    },
    companyLinks: [
      {
        isPrimary: true,
        company: {
          id: "company-1",
          name: "Northline Health",
          domain: "northline.health",
        },
      },
    ],
    ...overrides,
  };
}

function companyRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "company-1",
    workspaceId: "northstar-labs",
    name: "Northline Health",
    domain: "northline.health",
    industry: "Healthcare",
    website: "https://northline.health",
    archivedAt: null,
    createdAt: new Date("2026-03-18T00:00:00.000Z"),
    updatedAt: new Date("2026-03-18T12:00:00.000Z"),
    owner: {
      id: "kira-sloan",
      name: "Kira Sloan",
      email: "kira@northstarlabs.io",
      role: "ADMIN",
    },
    contacts: [
      {
        isPrimary: true,
        contact: {
          id: "contact-1",
          firstName: "Ari",
          lastName: "Mendoza",
          email: "ari@northline.health",
          title: "Head of Ops",
        },
      },
    ],
    deals: [
      {
        isPrimary: true,
        deal: {
          id: "deal-1",
          title: "Northline rollout",
          stage: {
            id: "stage-proposal",
            name: "Proposal",
            kind: "PROPOSAL",
          },
        },
      },
    ],
    ...overrides,
  };
}

function dealRecord(overrides: Record<string, unknown> = {}) {
  return {
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
      id: "stage-proposal",
      name: "Proposal",
      kind: "PROPOSAL",
      position: 2,
    },
    contacts: [
      {
        contact: {
          id: "contact-1",
          firstName: "Ari",
          lastName: "Mendoza",
          email: "ari@northline.health",
        },
      },
    ],
    companies: [
      {
        isPrimary: true,
        company: {
          id: "company-1",
          name: "Northline Health",
          domain: "northline.health",
        },
      },
    ],
    ...overrides,
  };
}

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
        create: vi.fn().mockResolvedValue(contactRecord({ owner: null, companyLinks: [] })),
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

  it("lists contacts for the workspace", async () => {
    const request = sessionRequest();
    mockPrisma.contact.findMany.mockResolvedValue([contactRecord()]);

    const result = await listContacts(request, { q: "ari", includeArchived: false, limit: 25 });

    expect(result.items[0]).toMatchObject({
      fullName: "Ari Mendoza",
      companies: [expect.objectContaining({ name: "Northline Health" })],
    });
  });

  it("gets and updates a contact", async () => {
    const request = sessionRequest();
    mockPrisma.contact.findFirst.mockResolvedValue(contactRecord());

    await expect(getContact(request, "contact-1")).resolves.toMatchObject({
      fullName: "Ari Mendoza",
    });

    const tx = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "kira-sloan" }),
      },
      company: {
        findMany: vi.fn().mockResolvedValue([{ id: "company-1" }]),
      },
      contact: {
        findFirst: vi.fn().mockResolvedValue(contactRecord()),
        update: vi.fn().mockResolvedValue(
          contactRecord({
            firstName: "Aria",
            email: "aria@northline.health",
          }),
        ),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await updateContact(request, "contact-1", {
      firstName: "Aria",
      email: "aria@northline.health",
      ownerId: "kira-sloan",
      companyIds: ["company-1"],
    });

    expect(result).toMatchObject({
      firstName: "Aria",
      email: "aria@northline.health",
    });
  });

  it("archives contacts and throws on missing records", async () => {
    const request = sessionRequest();
    mockPrisma.contact.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(archiveContact(request, "contact-1")).resolves.toEqual({ ok: true });
    await expect(archiveContact(request, "missing")).rejects.toThrow("Contact not found.");
  });

  it("lists, gets, updates, and archives companies", async () => {
    const request = sessionRequest();
    mockPrisma.company.findMany.mockResolvedValue([companyRecord()]);
    mockPrisma.company.findFirst.mockResolvedValue(companyRecord());

    await expect(listCompanies(request, { q: "north", includeArchived: false, limit: 25 })).resolves.toEqual({
      items: [expect.objectContaining({ name: "Northline Health" })],
    });
    await expect(getCompany(request, "company-1")).resolves.toMatchObject({
      name: "Northline Health",
      contacts: [expect.objectContaining({ name: "Ari Mendoza" })],
    });

    const tx = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "kira-sloan" }),
      },
      contact: {
        findMany: vi.fn().mockResolvedValue([{ id: "contact-1" }]),
      },
      company: {
        findFirst: vi.fn().mockResolvedValue(companyRecord()),
        create: vi.fn().mockResolvedValue(companyRecord()),
        update: vi.fn().mockResolvedValue(companyRecord({ name: "Northline Labs" })),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      createCompany(request, {
        name: "Northline Health",
        domain: "northline.health",
        industry: "Healthcare",
        website: "https://northline.health",
        ownerId: "kira-sloan",
        contactIds: ["contact-1"],
        primaryContactId: "contact-1",
      }),
    ).resolves.toMatchObject({ name: "Northline Health" });

    await expect(
      updateCompany(request, "company-1", {
        name: "Northline Labs",
        ownerId: "kira-sloan",
        contactIds: ["contact-1"],
        primaryContactId: "contact-1",
      }),
    ).resolves.toMatchObject({ name: "Northline Labs" });

    mockPrisma.company.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    await expect(archiveCompany(request, "company-1")).resolves.toEqual({ ok: true });
    await expect(archiveCompany(request, "missing")).rejects.toThrow("Company not found.");
  });

  it("rejects companies when primary contact is outside the linked set", async () => {
    const request = sessionRequest();
    const tx = {
      user: { findFirst: vi.fn() },
      contact: { findMany: vi.fn().mockResolvedValue([{ id: "contact-1" }]) },
      company: { findFirst: vi.fn().mockResolvedValue(companyRecord()), update: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      updateCompany(request, "company-1", {
        contactIds: ["contact-1"],
        primaryContactId: "contact-2",
      }),
    ).rejects.toThrow("Primary contact must be part of the linked contact set.");
  });

  it("lists, gets, updates, creates, and archives deals", async () => {
    const request = sessionRequest();
    mockPrisma.deal.findMany.mockResolvedValue([dealRecord()]);
    mockPrisma.deal.findFirst.mockResolvedValue(dealRecord());

    await expect(listDeals(request, { q: "north", includeArchived: false, limit: 25 })).resolves.toEqual({
      items: [expect.objectContaining({ title: "Northline rollout" })],
    });
    await expect(getDeal(request, "deal-1")).resolves.toMatchObject({
      title: "Northline rollout",
      stage: expect.objectContaining({ name: "Proposal" }),
    });

    const tx = {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "kira-sloan" }) },
      company: { findMany: vi.fn().mockResolvedValue([{ id: "company-1" }]) },
      contact: { findMany: vi.fn().mockResolvedValue([{ id: "contact-1" }]) },
      pipeline: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: "pipeline-sales",
            stages: [{ id: "stage-lead" }],
          })
          .mockResolvedValueOnce({
            id: "pipeline-sales",
            stages: [{ id: "stage-lead" }],
          }),
      },
      pipelineStage: { findFirst: vi.fn() },
      deal: {
        findFirst: vi.fn().mockResolvedValue(dealRecord()),
        create: vi.fn().mockResolvedValue(dealRecord({ stage: { id: "stage-lead", name: "Lead", kind: "LEAD", position: 0 } })),
        update: vi.fn().mockResolvedValue(dealRecord({ title: "Northline expansion" })),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      createDeal(request, {
        title: "Northline rollout",
        amount: 12000,
        currency: "usd",
        closeDate: null,
        ownerId: "kira-sloan",
        pipelineId: "pipeline-sales",
        stageId: null,
        companyIds: ["company-1"],
        primaryCompanyId: "company-1",
        contactIds: ["contact-1"],
      }),
    ).resolves.toMatchObject({
      stage: expect.objectContaining({ id: "stage-lead" }),
      currency: "USD",
    });

    await expect(
      updateDeal(request, "deal-1", {
        title: "Northline expansion",
        amount: 14000,
        currency: "usd",
        companyIds: ["company-1"],
        primaryCompanyId: "company-1",
        contactIds: ["contact-1"],
      }),
    ).resolves.toMatchObject({
      title: "Northline expansion",
    });

    mockPrisma.deal.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    await expect(archiveDeal(request, "deal-1")).resolves.toEqual({ ok: true });
    await expect(archiveDeal(request, "missing")).rejects.toThrow("Deal not found.");
  });

  it("rejects deals when the primary company is outside the linked set", async () => {
    const request = sessionRequest();
    const tx = {
      user: { findFirst: vi.fn() },
      company: { findMany: vi.fn().mockResolvedValue([{ id: "company-1" }]) },
      contact: { findMany: vi.fn().mockResolvedValue([]) },
      deal: { findFirst: vi.fn().mockResolvedValue(dealRecord()), update: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      updateDeal(request, "deal-1", {
        companyIds: ["company-1"],
        primaryCompanyId: "company-2",
      }),
    ).rejects.toThrow("Primary company must be part of the linked company set.");
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

  it("rejects requests without a valid workspace session", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await expect(
      listContacts(
        {
          headers: new Headers({
            "x-workspace-id": "northstar-labs",
            "x-user-id": "missing-user",
          }),
        } as never,
        { includeArchived: false, limit: 25 },
      ),
    ).rejects.toThrow("Workspace session is invalid.");
  });
});
