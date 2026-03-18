import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  workspace: {
    findFirst: vi.fn(),
  },
  pipeline: {
    findFirst: vi.fn(),
  },
  deal: {
    aggregate: vi.fn(),
  },
  task: {
    findMany: vi.fn(),
  },
  activity: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { getDashboardMetrics } from "@/lib/crm/dashboard-metrics";

describe("dashboard metrics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("aggregates workspace dashboard data", async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({
      id: "northstar-labs",
      name: "Northstar Labs",
    });
    mockPrisma.pipeline.findFirst.mockResolvedValue({
      id: "pipeline-sales",
      name: "Sales Pipeline",
      stages: [
        {
          id: "stage-lead",
          name: "Lead",
          kind: "LEAD",
          deals: [{ id: "deal-1", title: "Pilot", amount: 2000, currency: "USD" }],
        },
        {
          id: "stage-proposal",
          name: "Proposal",
          kind: "PROPOSAL",
          deals: [{ id: "deal-2", title: "Rollout", amount: 8000, currency: "USD" }],
        },
      ],
    });
    mockPrisma.deal.aggregate.mockResolvedValue({
      _count: { id: 2 },
      _sum: { amount: 10000 },
    });
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: "task-1",
        title: "Send proposal recap",
        dueAt: new Date("2026-03-18T09:00:00.000Z"),
        status: "TODO",
        assignee: { name: "Kira Sloan" },
        contact: null,
        company: null,
        deal: { title: "Rollout" },
      },
    ]);
    mockPrisma.activity.findMany.mockResolvedValue([
      {
        id: "activity-1",
        type: "STAGE_CHANGE",
        summary: "Stage moved to Proposal",
        happenedAt: new Date("2026-03-18T11:00:00.000Z"),
        contact: null,
        company: null,
        deal: { title: "Rollout" },
      },
    ]);

    const data = await getDashboardMetrics({ workspaceId: "northstar-labs" });

    expect(data.workspace.name).toBe("Northstar Labs");
    expect(data.summaryCards[0]).toMatchObject({
      label: "Open deals",
      value: "2",
    });
    expect(data.stageBreakdown).toEqual([
      expect.objectContaining({ name: "Lead", totalValue: 2000, dealCount: 1 }),
      expect.objectContaining({ name: "Proposal", totalValue: 8000, dealCount: 1 }),
    ]);
    expect(data.overdueTasks[0]).toMatchObject({
      title: "Send proposal recap",
      linkedLabel: "Rollout",
    });
    expect(data.recentActivity[0]).toMatchObject({
      summary: "Stage moved to Proposal",
      linkedLabel: "Rollout",
    });
  });
});
