import { ActivityType, Prisma, TaskStatus, UserRole } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

import type {
  ActivityCreateInput,
  NoteCreateInput,
  RecordTarget,
  TaskCreateInput,
  TaskQueryInput,
  TaskUpdateInput,
} from "@/lib/crm/activity-schemas";

export type WorkspaceContext = {
  workspaceId: string;
  userId: string;
  userName: string;
  role: UserRole;
};

export type TimelineItem = {
  id: string;
  kind: "note" | "task" | "activity";
  title: string;
  body: string;
  occurredAt: string;
  badge: string;
  tone: "open" | "pending" | "paused";
  isOverdue?: boolean;
  recordHref: string;
};

export type WorkspaceTaskItem = {
  id: string;
  title: string;
  dueAt: string | null;
  completedAt: string | null;
  status: TaskStatus;
  isOverdue: boolean;
  assignee: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  record: {
    type: "contact" | "company" | "deal" | "workspace";
    id: string;
    title: string;
    href: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceOwner = {
  id: string;
  name: string;
  role: UserRole;
};

const recordFieldMap: Record<
  RecordTarget["type"],
  { relation: "contactId" | "companyId" | "dealId"; hrefPrefix: string }
> = {
  contact: {
    relation: "contactId",
    hrefPrefix: "/contacts",
  },
  company: {
    relation: "companyId",
    hrefPrefix: "/companies",
  },
  deal: {
    relation: "dealId",
    hrefPrefix: "/deals",
  },
};

function formatFullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function normalizeMaybeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

async function getContextFromHeaders(source: Headers): Promise<WorkspaceContext> {
  const workspaceId = source.get("x-workspace-id");
  const userId = source.get("x-user-id");

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

export async function getWorkspaceContextFromRequest(request: NextRequest) {
  return getContextFromHeaders(request.headers);
}

export async function getWorkspaceContextFromServer() {
  return getContextFromHeaders(await headers());
}

export async function getWorkspaceOwners(workspaceId: string): Promise<WorkspaceOwner[]> {
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

async function resolveTargetOrThrow(tx: Prisma.TransactionClient, context: WorkspaceContext, target: RecordTarget) {
  const query = {
    where: {
      id: target.id,
      workspaceId: context.workspaceId,
    },
    select: {
      id: true,
    },
  } as const;

  if (target.type === "contact") {
    const record = await tx.contact.findFirst(query);
    if (!record) throw new ApiError(404, "Contact not found.");
  } else if (target.type === "company") {
    const record = await tx.company.findFirst(query);
    if (!record) throw new ApiError(404, "Company not found.");
  } else {
    const record = await tx.deal.findFirst(query);
    if (!record) throw new ApiError(404, "Deal not found.");
  }
}

function buildRecordHref(target: RecordTarget) {
  return `${recordFieldMap[target.type].hrefPrefix}/${target.id}`;
}

function targetWhere(target?: RecordTarget) {
  if (!target) {
    return {};
  }

  return {
    [recordFieldMap[target.type].relation]: target.id,
  } as Prisma.TaskWhereInput & Prisma.NoteWhereInput & Prisma.ActivityWhereInput;
}

function mapTimelineTone(kind: TimelineItem["kind"], isOverdue?: boolean): TimelineItem["tone"] {
  if (kind === "activity") {
    return "open";
  }

  if (kind === "task" && isOverdue) {
    return "pending";
  }

  if (kind === "task") {
    return "pending";
  }

  return "open";
}

export async function listTimelineForTarget(context: WorkspaceContext, target: RecordTarget) {
  const [notes, tasks, activities] = await Promise.all([
    prisma.note.findMany({
      where: {
        workspaceId: context.workspaceId,
        ...targetWhere(target),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        body: true,
        createdAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        workspaceId: context.workspaceId,
        ...targetWhere(target),
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
    prisma.activity.findMany({
      where: {
        workspaceId: context.workspaceId,
        ...targetWhere(target),
      },
      orderBy: {
        happenedAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        type: true,
        summary: true,
        happenedAt: true,
      },
    }),
  ]);

  const timeline = [
    ...notes.map<TimelineItem>((note) => ({
      id: note.id,
      kind: "note",
      title: "Note added",
      body: note.body,
      occurredAt: note.createdAt.toISOString(),
      badge: "Note",
      tone: "open",
      recordHref: buildRecordHref(target),
    })),
    ...tasks.map<TimelineItem>((task) => {
      const overdue = Boolean(
        task.dueAt &&
          !task.completedAt &&
          task.status !== TaskStatus.DONE &&
          task.dueAt.getTime() < Date.now(),
      );

      return {
        id: task.id,
        kind: "task",
        title: task.title,
        body: task.completedAt
          ? "Completed task"
          : task.dueAt
            ? `Due ${task.dueAt.toISOString().slice(0, 10)}`
            : "No due date",
        occurredAt: (task.completedAt ?? task.updatedAt ?? task.createdAt).toISOString(),
        badge: overdue ? "Overdue task" : task.status,
        tone: mapTimelineTone("task", overdue),
        isOverdue: overdue,
        recordHref: buildRecordHref(target),
      };
    }),
    ...activities.map<TimelineItem>((activity) => ({
      id: activity.id,
      kind: "activity",
      title: activity.type.replaceAll("_", " "),
      body: activity.summary,
      occurredAt: activity.happenedAt.toISOString(),
      badge: activity.type,
      tone: mapTimelineTone("activity"),
      recordHref: buildRecordHref(target),
    })),
  ].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

  return timeline;
}

export async function listWorkspaceTasks(
  context: WorkspaceContext,
  query: TaskQueryInput = { includeCompleted: false },
) {
  const tasks = await prisma.task.findMany({
    where: {
      workspaceId: context.workspaceId,
      ...(query.targetType && query.targetId ? targetWhere({ type: query.targetType, id: query.targetId }) : {}),
      ...(query.includeCompleted ? {} : { status: { not: TaskStatus.DONE } }),
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      deal: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return tasks.map<WorkspaceTaskItem>((task) => {
    const record =
      task.contact
        ? {
            type: "contact" as const,
            id: task.contact.id,
            title: formatFullName(task.contact.firstName, task.contact.lastName),
            href: `/contacts/${task.contact.id}`,
          }
        : task.company
          ? {
              type: "company" as const,
              id: task.company.id,
              title: task.company.name,
              href: `/companies/${task.company.id}`,
            }
          : task.deal
            ? {
                type: "deal" as const,
                id: task.deal.id,
                title: task.deal.title,
                href: `/deals/${task.deal.id}`,
              }
            : {
                type: "workspace" as const,
                id: context.workspaceId,
                title: "Workspace",
                href: null,
              };

    return {
      id: task.id,
      title: task.title,
      dueAt: normalizeMaybeDate(task.dueAt),
      completedAt: normalizeMaybeDate(task.completedAt),
      status: task.status,
      isOverdue:
        Boolean(task.dueAt) && task.status !== TaskStatus.DONE && task.dueAt!.getTime() < Date.now(),
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            role: task.assignee.role,
          }
        : null,
      record,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  });
}

export async function createNote(context: WorkspaceContext, input: NoteCreateInput) {
  if (!input.targetType || !input.targetId) {
    throw new ApiError(400, "A note target is required.");
  }

  return prisma.$transaction(async (tx) => {
    const target = { type: input.targetType, id: input.targetId } as RecordTarget;
    await resolveTargetOrThrow(tx, context, target);
    const relation = recordFieldMap[target.type].relation;

    const note = await tx.note.create({
      data: {
        workspaceId: context.workspaceId,
        body: input.body,
        [relation]: target.id,
      },
    });

    return {
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    };
  });
}

export async function createActivity(context: WorkspaceContext, input: ActivityCreateInput) {
  if (!input.targetType || !input.targetId) {
    throw new ApiError(400, "An activity target is required.");
  }

  return prisma.$transaction(async (tx) => {
    const target = { type: input.targetType, id: input.targetId } as RecordTarget;
    await resolveTargetOrThrow(tx, context, target);
    const relation = recordFieldMap[target.type].relation;

    const activity = await tx.activity.create({
      data: {
        workspaceId: context.workspaceId,
        type: input.type as ActivityType,
        summary: input.summary,
        happenedAt: input.happenedAt ? new Date(input.happenedAt) : new Date(),
        [relation]: target.id,
      },
    });

    return {
      id: activity.id,
      type: activity.type,
      summary: activity.summary,
      happenedAt: activity.happenedAt.toISOString(),
    };
  });
}

export async function createTask(context: WorkspaceContext, input: TaskCreateInput) {
  return prisma.$transaction(async (tx) => {
    const target = input.targetType && input.targetId ? { type: input.targetType, id: input.targetId } : null;

    if (target) {
      await resolveTargetOrThrow(tx, context, target);
    }

    const assigneeId =
      input.assigneeId ?? context.userId;

    const assignee = await tx.user.findFirst({
      where: {
        id: assigneeId,
        workspaceId: context.workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!assignee) {
      throw new ApiError(400, "Assignee does not belong to the current workspace.");
    }

    const task = await tx.task.create({
      data: {
        workspaceId: context.workspaceId,
        title: input.title,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        assigneeId: assignee.id,
        ...(target ? { [recordFieldMap[target.type].relation]: target.id } : {}),
      },
    });

    return {
      id: task.id,
      title: task.title,
      dueAt: task.dueAt?.toISOString() ?? null,
      status: task.status,
    };
  });
}

export async function updateTask(context: WorkspaceContext, taskId: string, input: TaskUpdateInput) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        workspaceId: context.workspaceId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        completedAt: true,
        contactId: true,
        companyId: true,
        dealId: true,
      },
    });

    if (!task) {
      throw new ApiError(404, "Task not found.");
    }

    let assigneeId: string | null | undefined = undefined;
    if (input.assigneeId !== undefined) {
      if (input.assigneeId === null) {
        assigneeId = null;
      } else {
        const assignee = await tx.user.findFirst({
          where: {
            id: input.assigneeId,
            workspaceId: context.workspaceId,
          },
          select: {
            id: true,
          },
        });

        if (!assignee) {
          throw new ApiError(400, "Assignee does not belong to the current workspace.");
        }

        assigneeId = assignee.id;
      }
    }

    const updatedTask = await tx.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(input.status !== undefined
          ? {
              status: input.status as TaskStatus,
              completedAt: input.status === "DONE" ? new Date() : null,
            }
          : {}),
      },
    });

    if (input.status && input.status !== task.status) {
      await tx.activity.create({
        data: {
          workspaceId: context.workspaceId,
          type: ActivityType.TASK,
          summary:
            input.status === "DONE"
              ? `Task completed: ${updatedTask.title}`
              : `Task reopened: ${updatedTask.title}`,
          happenedAt: new Date(),
          ...(updatedTask.contactId ? { contactId: updatedTask.contactId } : {}),
          ...(updatedTask.companyId ? { companyId: updatedTask.companyId } : {}),
          ...(updatedTask.dealId ? { dealId: updatedTask.dealId } : {}),
        },
      });
    }

    return {
      id: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status,
      dueAt: updatedTask.dueAt?.toISOString() ?? null,
      completedAt: updatedTask.completedAt?.toISOString() ?? null,
    };
  });
}

export async function listWorkspaceActivities(
  context: WorkspaceContext,
  query: Pick<TaskQueryInput, "targetType" | "targetId"> = {},
) {
  const activities = await prisma.activity.findMany({
    where: {
      workspaceId: context.workspaceId,
      ...(query.targetType && query.targetId ? targetWhere({ type: query.targetType, id: query.targetId }) : {}),
    },
    orderBy: {
      happenedAt: "desc",
    },
    take: 100,
  });

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    summary: activity.summary,
    happenedAt: activity.happenedAt.toISOString(),
  }));
}
