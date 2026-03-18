import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { noteCreateSchema } from "@/lib/crm/activity-schemas";
import { createNote, getWorkspaceContextFromRequest, listTimelineForTarget } from "@/lib/crm/activity-service";

export async function GET(request: NextRequest) {
  try {
    const context = await getWorkspaceContextFromRequest(request);
    const targetType = request.nextUrl.searchParams.get("targetType");
    const targetId = request.nextUrl.searchParams.get("targetId");

    if (!targetType || !targetId) {
      return jsonResponse({ items: [] });
    }

    const items = await listTimelineForTarget(context, {
      type: targetType as "contact" | "company" | "deal",
      id: targetId,
    });

    return jsonResponse({ items: items.filter((item) => item.kind === "note") });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getWorkspaceContextFromRequest(request);
    const input = await parseRequestBody(request, noteCreateSchema);
    const item = await createNote(context, input);
    return jsonResponse({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
