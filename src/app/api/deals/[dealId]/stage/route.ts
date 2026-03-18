import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { dealStageUpdateSchema } from "@/lib/crm/schemas";
import { updateDealStage } from "@/lib/crm/service";

type DealStageRouteProps = {
  params: Promise<{ dealId: string }>;
};

export async function PATCH(request: NextRequest, { params }: DealStageRouteProps) {
  try {
    const { dealId } = await params;
    const input = await parseRequestBody(request, dealStageUpdateSchema);
    const data = await updateDealStage(request, dealId, input);
    return jsonResponse({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}
