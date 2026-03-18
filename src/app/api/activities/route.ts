import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { activityCreateSchema, taskQuerySchema } from "@/lib/crm/activity-schemas";
import { createActivity, getWorkspaceContextFromRequest, listWorkspaceActivities } from "@/lib/crm/activity-service";

export async function GET(request: NextRequest) {
  try {
    const context = await getWorkspaceContextFromRequest(request);
    const input = taskQuerySchema.parse({
      targetType: request.nextUrl.searchParams.get("targetType") ?? undefined,
      targetId: request.nextUrl.searchParams.get("targetId") ?? undefined,
      includeCompleted: true,
    });

    const items = await listWorkspaceActivities(context, input);
    return jsonResponse({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getWorkspaceContextFromRequest(request);
    const input = await parseRequestBody(request, activityCreateSchema);
    const item = await createActivity(context, input);
    return jsonResponse({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
