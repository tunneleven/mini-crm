import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export type DashboardMetrics = {
  workspace: {
    id: string;
    name: string;
  };
  summaryCards: Array<{
    label: string;
    value: string;
    note: string;
    tone: "neutral" | "good" | "warn";
  }>;
  stageBreakdown: Array<{
    id: string;
    name: string;
    kind: string;
    dealCount: number;
    totalValue: number;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    dueAt: string;
    status: string;
    ownerName: string | null;
    linkedLabel: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    summary: string;
    happenedAt: string;
    linkedLabel: string;
  }>;
};

type DashboardMetricsOptions = {
  workspaceId: string;
};

function formatFullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function formatCurrency(amount: number | null) {
  if (amount === null) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function getDashboardMetrics({ workspaceId }: DashboardMetricsOptions): Promise<DashboardMetrics> {
  const [workspace, pipeline, dealSummary, overdueTasks, recentActivity] = await Promise.all([
    prisma.workspace.findFirst({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.pipeline.findFirst({
      where: {
        workspaceId,
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
              select: {
                id: true,
                title: true,
                amount: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    }),
    prisma.deal.aggregate({
      where: {
        workspaceId,
        archivedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.task.findMany({
      where: {
        workspaceId,
        status: {
          not: "DONE",
        },
        dueAt: {
          lt: new Date(),
        },
      },
      orderBy: [
        {
          dueAt: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
        assignee: {
          select: {
            name: true,
          },
        },
        contact: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
        deal: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.activity.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        happenedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        summary: true,
        happenedAt: true,
        contact: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
        deal: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found.`);
  }

  const stageBreakdown = pipeline?.stages.map((stage) => {
    const totalValue = stage.deals.reduce((sum, deal) => sum + Number(deal.amount ?? 0), 0);

    return {
      id: stage.id,
      name: stage.name,
      kind: stage.kind,
      dealCount: stage.deals.length,
      totalValue,
    };
  }) ?? [];

  return {
    workspace,
    summaryCards: [
      {
        label: "Open deals",
        value: String(dealSummary._count.id ?? 0),
        note: "Active opportunities in the workspace",
        tone: "good",
      },
      {
        label: "Pipeline value",
        value: formatCurrency(Number(dealSummary._sum.amount ?? 0)),
        note: pipeline ? `${pipeline.name} pipeline` : "No active pipeline",
        tone: "neutral",
      },
      {
        label: "Overdue tasks",
        value: String(overdueTasks.length),
        note: "Needs follow-up today",
        tone: overdueTasks.length > 0 ? "warn" : "good",
      },
      {
        label: "Recent activity",
        value: String(recentActivity.length),
        note: "Latest timeline entries",
        tone: "neutral",
      },
    ],
    stageBreakdown,
    overdueTasks: overdueTasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt?.toISOString() ?? new Date().toISOString(),
      status: task.status,
      ownerName: task.assignee?.name ?? null,
      linkedLabel:
        task.deal?.title ??
        task.company?.name ??
        formatFullName(task.contact?.firstName ?? "", task.contact?.lastName ?? null) ??
        "Workspace task",
    })),
    recentActivity: recentActivity.map((activity) => ({
      id: activity.id,
      type: activity.type,
      summary: activity.summary,
      happenedAt: activity.happenedAt.toISOString(),
      linkedLabel:
        activity.deal?.title ??
        activity.company?.name ??
        formatFullName(activity.contact?.firstName ?? "", activity.contact?.lastName ?? null) ??
        "Workspace activity",
    })),
  };
}

export async function getDashboardMetricsFromServer() {
  const headerStore = await headers();
  const workspaceId = headerStore.get("x-workspace-id");

  if (!workspaceId) {
    throw new Error("Workspace session headers are missing.");
  }

  return getDashboardMetrics({ workspaceId });
}
