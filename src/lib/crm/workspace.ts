import { UserRole } from "@prisma/client";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export type WorkspaceActor = {
  workspaceId: string;
  userId: string;
  userName: string;
  role: UserRole;
};

export async function resolveWorkspaceActor(request: NextRequest): Promise<WorkspaceActor> {
  const workspaceId = request.headers.get("x-workspace-id");
  const userId = request.headers.get("x-user-id");

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

export async function resolveWorkspaceIdFromServer(): Promise<string> {
  const headerStore = await headers();
  const workspaceId = headerStore.get("x-workspace-id");

  if (!workspaceId) {
    throw new ApiError(401, "Workspace session headers are missing.");
  }

  return workspaceId;
}
