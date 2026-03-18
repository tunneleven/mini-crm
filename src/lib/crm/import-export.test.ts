import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
  contact: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  company: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  deal: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  pipeline: {
    findFirst: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { exportResourceCsv, importResourceCsv } from "@/lib/crm/import-export";
import { importQuerySchema, parseImportResource } from "@/lib/crm/import-export-schemas";

describe("import-export", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("exports contacts as CSV", async () => {
    mockPrisma.contact.findMany.mockResolvedValue([
      {
        id: "contact-1",
        firstName: "Ari",
        lastName: "Mendoza",
        email: "ari@northline.health",
        phone: "555-0101",
        title: "Head of Ops",
        createdAt: new Date("2026-03-18T00:00:00.000Z"),
        updatedAt: new Date("2026-03-18T12:00:00.000Z"),
        owner: {
          name: "Kira Sloan",
        },
        companyLinks: [
          {
            company: {
              name: "Northline Health",
            },
          },
        ],
      },
    ]);

    const csv = await exportResourceCsv("northstar-labs", "contacts");

    expect(mockPrisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: "northstar-labs",
        }),
      }),
    );
    expect(csv).toContain("id,firstName,lastName,email,phone,title,ownerName,companyNames,createdAt,updatedAt");
    expect(csv).toContain("contact-1,Ari,Mendoza,ari@northline.health,555-0101,Head of Ops,Kira Sloan,Northline Health");
  });

  it("imports contacts with partial success and row-level validation errors", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "owner-1",
    });
    mockPrisma.contact.findFirst.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({
      id: "contact-new",
    });

    const csv = [
      "firstName,lastName,email,ownerEmail",
      "Ari,Mendoza,ari@northline.health,kira@northstarlabs.io",
      ",Missing,broken@example.com,kira@northstarlabs.io",
    ].join("\n");

    const result = await importResourceCsv("northstar-labs", "contacts", csv);

    expect(result.summary).toEqual({
      totalRows: 2,
      createdRows: 1,
      updatedRows: 0,
      failedRows: 1,
    });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      rowNumber: 3,
    });
    expect(result.errors[0].fields).toContain("firstName");
    expect(mockPrisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: "northstar-labs",
          firstName: "Ari",
        }),
      }),
    );
  });

  it("exports companies and deals as CSV", async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      {
        id: "company-1",
        name: "Northline Health",
        domain: "northline.health",
        industry: "Healthcare",
        website: "https://northline.health",
        createdAt: new Date("2026-03-18T00:00:00.000Z"),
        updatedAt: new Date("2026-03-18T12:00:00.000Z"),
        owner: { name: "Kira Sloan" },
        contacts: [
          {
            contact: { firstName: "Ari", lastName: "Mendoza" },
          },
        ],
      },
    ]);
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        title: "Northline rollout",
        amount: 12000,
        currency: "USD",
        closeDate: new Date("2026-04-01T00:00:00.000Z"),
        createdAt: new Date("2026-03-18T00:00:00.000Z"),
        updatedAt: new Date("2026-03-18T12:00:00.000Z"),
        owner: { name: "Kira Sloan" },
        pipeline: { name: "Sales Pipeline" },
        stage: { name: "Proposal" },
        companies: [{ company: { name: "Northline Health" } }],
        contacts: [{ contact: { firstName: "Ari", lastName: "Mendoza" } }],
      },
    ]);

    const companiesCsv = await exportResourceCsv("northstar-labs", "companies");
    const dealsCsv = await exportResourceCsv("northstar-labs", "deals");

    expect(companiesCsv).toContain("Northline Health");
    expect(companiesCsv).toContain("Ari Mendoza");
    expect(dealsCsv).toContain("Northline rollout");
    expect(dealsCsv).toContain("Sales Pipeline");
  });

  it("imports companies by updating existing records", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "owner-1" });
    mockPrisma.company.findFirst.mockResolvedValue({ id: "company-1" });
    mockPrisma.company.update.mockResolvedValue({ id: "company-1" });

    const csv = ["name,domain,industry,website,ownerEmail", "Northline Health,northline.health,Healthcare,https://northline.health,kira@northstarlabs.io"].join("\n");
    const result = await importResourceCsv("northstar-labs", "companies", csv);

    expect(result.summary).toEqual({
      totalRows: 1,
      createdRows: 0,
      updatedRows: 1,
      failedRows: 0,
    });
    expect(mockPrisma.company.update).toHaveBeenCalled();
  });

  it("imports deals and reports stage or owner failures", async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce({ id: "owner-1" }).mockResolvedValueOnce(null);
    mockPrisma.pipeline.findFirst.mockResolvedValue({
      id: "pipeline-sales",
      name: "Sales Pipeline",
      stages: [{ id: "stage-proposal", name: "Proposal" }],
    });
    mockPrisma.deal.findFirst.mockResolvedValue(null);
    mockPrisma.deal.create.mockResolvedValue({ id: "deal-1" });

    const successCsv = ["title,amount,currency,closeDate,ownerEmail,pipelineName,stageName", "Northline rollout,12000,usd,2026-04-01,kira@northstarlabs.io,Sales Pipeline,Proposal"].join("\n");
    const success = await importResourceCsv("northstar-labs", "deals", successCsv);
    expect(success.summary.createdRows).toBe(1);

    const failureCsv = ["title,amount,currency,ownerEmail,pipelineName,stageName", "Broken deal,1000,usd,missing@northstarlabs.io,Sales Pipeline,Proposal"].join("\n");
    const failure = await importResourceCsv("northstar-labs", "deals", failureCsv);
    expect(failure.summary.failedRows).toBe(1);
    expect(failure.errors[0].message).toContain("Owner missing@northstarlabs.io was not found");
  });

  it("parses import resource and query values", () => {
    expect(parseImportResource("contacts")).toBe("contacts");
    expect(importQuerySchema.parse({ includeArchived: "true" })).toEqual({ includeArchived: true });
    expect(importQuerySchema.parse({ includeArchived: "false" })).toEqual({ includeArchived: false });
  });
});
