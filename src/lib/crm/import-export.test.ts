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
});
