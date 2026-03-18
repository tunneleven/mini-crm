import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { updateDealStage } from "@/lib/crm/service";

describe("crm service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("updates a deal stage and records a stage-change activity", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "kira-sloan",
      name: "Kira Sloan",
      role: "ADMIN",
    });

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

    const request = {
      headers: new Headers({
        "x-workspace-id": "northstar-labs",
        "x-user-id": "kira-sloan",
      }),
    } as never;

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
});
