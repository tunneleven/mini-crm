import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
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

const mockHeaders = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

import {
  createActivity,
  createNote,
  createTask,
  getWorkspaceContextFromRequest,
  getWorkspaceContextFromServer,
  getWorkspaceOwners,
  listTimelineForTarget,
  listWorkspaceActivities,
  listWorkspaceTasks,
  updateTask,
  type WorkspaceContext,
} from "@/lib/crm/activity-service";

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

  it("resolves workspace context from request and server headers", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "kira-sloan",
      name: "Kira Sloan",
      role: "ADMIN",
    });
    mockHeaders.mockResolvedValue(
      new Headers({
        "x-workspace-id": "northstar-labs",
        "x-user-id": "kira-sloan",
      }),
    );

    await expect(
      getWorkspaceContextFromRequest({
        headers: new Headers({
          "x-workspace-id": "northstar-labs",
          "x-user-id": "kira-sloan",
        }),
      } as never),
    ).resolves.toMatchObject({ userName: "Kira Sloan" });

    await expect(getWorkspaceContextFromServer()).resolves.toMatchObject({ userId: "kira-sloan" });
  });

  it("lists workspace owners and tasks", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: "kira-sloan", name: "Kira Sloan", role: "ADMIN" }]);
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: "task-1",
        title: "Follow up",
        dueAt: new Date("2026-03-17T08:00:00.000Z"),
        completedAt: null,
        status: "TODO",
        assignee: { id: "kira-sloan", name: "Kira Sloan", role: "ADMIN" },
        contact: null,
        company: { id: "company-1", name: "Northline Health" },
        deal: null,
        createdAt: new Date("2026-03-18T00:00:00.000Z"),
        updatedAt: new Date("2026-03-18T09:00:00.000Z"),
      },
    ]);

    await expect(getWorkspaceOwners("northstar-labs")).resolves.toEqual([
      { id: "kira-sloan", name: "Kira Sloan", role: "ADMIN" },
    ]);

    const tasks = await listWorkspaceTasks(context, { includeCompleted: false });
    expect(tasks[0]).toMatchObject({
      isOverdue: true,
      record: { type: "company", title: "Northline Health" },
    });
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

  it("creates notes, activities, tasks, and lists activities", async () => {
    const tx = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: "contact-1" }) },
      company: { findFirst: vi.fn() },
      deal: { findFirst: vi.fn() },
      note: {
        create: vi.fn().mockResolvedValue({
          id: "note-1",
          body: "Need legal review",
          createdAt: new Date("2026-03-18T10:00:00.000Z"),
        }),
      },
      activity: {
        create: vi.fn().mockResolvedValue({
          id: "activity-1",
          type: "CALL",
          summary: "Held discovery call",
          happenedAt: new Date("2026-03-18T11:00:00.000Z"),
        }),
      },
      task: {
        create: vi.fn().mockResolvedValue({
          id: "task-2",
          title: "Send follow-up",
          dueAt: new Date("2026-03-19T09:00:00.000Z"),
          status: "TODO",
        }),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "kira-sloan" }),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    );
    mockPrisma.activity.findMany.mockResolvedValue([
      {
        id: "activity-1",
        type: "CALL",
        summary: "Held discovery call",
        happenedAt: new Date("2026-03-18T11:00:00.000Z"),
      },
    ]);

    await expect(
      createNote(context, {
        targetType: "contact",
        targetId: "contact-1",
        body: "Need legal review",
      }),
    ).resolves.toMatchObject({ id: "note-1" });

    await expect(
      createActivity(context, {
        targetType: "contact",
        targetId: "contact-1",
        type: "CALL",
        summary: "Held discovery call",
        happenedAt: null,
      }),
    ).resolves.toMatchObject({ type: "CALL" });

    await expect(
      createTask(context, {
        targetType: "contact",
        targetId: "contact-1",
        title: "Send follow-up",
        dueAt: "2026-03-19T09:00:00.000Z",
        assigneeId: null,
      }),
    ).resolves.toMatchObject({ id: "task-2" });

    await expect(listWorkspaceActivities(context, { targetType: "contact", targetId: "contact-1" })).resolves.toEqual([
      {
        id: "activity-1",
        type: "CALL",
        summary: "Held discovery call",
        happenedAt: "2026-03-18T11:00:00.000Z",
      },
    ]);
  });

  it("rejects note creation without a target and invalid task assignees", async () => {
    await expect(
      createNote(context, {
        targetType: undefined,
        targetId: undefined,
        body: "No target",
      }),
    ).rejects.toThrow("A note target is required.");

    const tx = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: "contact-1" }) },
      company: { findFirst: vi.fn() },
      deal: { findFirst: vi.fn() },
      task: { create: vi.fn() },
      user: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    );

    await expect(
      createTask(context, {
        targetType: "contact",
        targetId: "contact-1",
        title: "Invalid assignee",
        dueAt: null,
        assigneeId: "missing-user",
      }),
    ).rejects.toThrow("Assignee does not belong to the current workspace.");
  });
});
