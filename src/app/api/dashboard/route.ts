import { NextRequest } from "next/server";

import { handleApiError, jsonResponse } from "@/lib/api";
import { resolveWorkspaceActor } from "@/lib/crm/workspace";
import { getDashboardMetrics } from "@/lib/crm/dashboard-metrics";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await resolveWorkspaceActor(request);
    const data = await getDashboardMetrics({ workspaceId });
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
