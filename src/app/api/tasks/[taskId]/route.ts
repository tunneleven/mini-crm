import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { taskUpdateSchema } from "@/lib/crm/activity-schemas";
import { getWorkspaceContextFromRequest, updateTask } from "@/lib/crm/activity-service";

type TaskRouteProps = {
  params: Promise<{ taskId: string }>;
};

export async function PATCH(request: NextRequest, { params }: TaskRouteProps) {
  try {
    const context = await getWorkspaceContextFromRequest(request);
    const { taskId } = await params;
    const input = await parseRequestBody(request, taskUpdateSchema);
    const item = await updateTask(context, taskId, input);
    return jsonResponse({ item });
  } catch (error) {
    return handleApiError(error);
  }
}
