import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  note: {
    findMany: vi.fn(),
  },
  task: {
    findMany: vi.fn(),
  },
  activity: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { listTimelineForTarget, updateTask, type WorkspaceContext } from "@/lib/crm/activity-service";

const context: WorkspaceContext = {
  workspaceId: "northstar-labs",
  userId: "kira-sloan",
  userName: "Kira Sloan",
  role: "ADMIN",
};

describe("activity service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("merges notes, tasks, and activities into a reverse chronological timeline", async () => {
    mockPrisma.note.findMany.mockResolvedValue([
      {
        id: "note-1",
        body: "Need legal review before signature.",
        createdAt: new Date("2026-03-18T10:00:00.000Z"),
      },
    ]);
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: "task-1",
        title: "Send pricing follow-up",
        status: "TODO",
        dueAt: new Date("2026-03-17T08:00:00.000Z"),
        completedAt: null,
        createdAt: new Date("2026-03-17T08:00:00.000Z"),
        updatedAt: new Date("2026-03-18T09:00:00.000Z"),
        assignee: null,
      },
    ]);
    mockPrisma.activity.findMany.mockResolvedValue([
      {
        id: "activity-1",
        type: "STAGE_CHANGE",
        summary: "Stage moved to Proposal",
        happenedAt: new Date("2026-03-18T11:30:00.000Z"),
      },
    ]);

    const timeline = await listTimelineForTarget(context, { type: "deal", id: "deal-1" });

    expect(timeline.map((item) => item.id)).toEqual(["activity-1", "note-1", "task-1"]);
    expect(timeline[2]).toMatchObject({
      badge: "Overdue task",
      isOverdue: true,
      recordHref: "/deals/deal-1",
    });
  });

  it("updates a task and writes a timeline activity when status changes", async () => {
    const tx = {
      task: {
        findFirst: vi.fn().mockResolvedValue({
          id: "task-1",
          title: "Send pricing follow-up",
          status: "TODO",
          completedAt: null,
          contactId: null,
          companyId: null,
          dealId: "deal-1",
        }),
        update: vi.fn().mockResolvedValue({
          id: "task-1",
          title: "Send pricing follow-up",
          status: "DONE",
          dueAt: null,
          completedAt: new Date("2026-03-18T12:00:00.000Z"),
          contactId: null,
          companyId: null,
          dealId: "deal-1",
        }),
      },
      user: {
        findFirst: vi.fn(),
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

    const result = await updateTask(context, "task-1", { status: "DONE" });

    expect(result.status).toBe("DONE");
    expect(tx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "task-1" },
        data: expect.objectContaining({
          status: "DONE",
        }),
      }),
    );
    expect(tx.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dealId: "deal-1",
          summary: "Task completed: Send pricing follow-up",
        }),
      }),
    );
  });
});
