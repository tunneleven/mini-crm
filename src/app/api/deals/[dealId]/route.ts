import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { dealUpdateSchema } from "@/lib/crm/schemas";
import { archiveDeal, getDeal, updateDeal } from "@/lib/crm/service";

type DealRouteProps = {
  params: Promise<{ dealId: string }>;
};

export async function GET(request: NextRequest, { params }: DealRouteProps) {
  try {
    const { dealId } = await params;
    const data = await getDeal(request, dealId);
    return jsonResponse({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: DealRouteProps) {
  try {
    const { dealId } = await params;
    const input = await parseRequestBody(request, dealUpdateSchema);
    const data = await updateDeal(request, dealId, input);
    return jsonResponse({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: DealRouteProps) {
  try {
    const { dealId } = await params;
    const data = await archiveDeal(request, dealId);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
