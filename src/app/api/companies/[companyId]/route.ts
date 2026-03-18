import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { companyUpdateSchema } from "@/lib/crm/schemas";
import { archiveCompany, getCompany, updateCompany } from "@/lib/crm/service";

type CompanyRouteProps = {
  params: Promise<{ companyId: string }>;
};

export async function GET(request: NextRequest, { params }: CompanyRouteProps) {
  try {
    const { companyId } = await params;
    const data = await getCompany(request, companyId);
    return jsonResponse({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: CompanyRouteProps) {
  try {
    const { companyId } = await params;
    const input = await parseRequestBody(request, companyUpdateSchema);
    const data = await updateCompany(request, companyId, input);
    return jsonResponse({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: CompanyRouteProps) {
  try {
    const { companyId } = await params;
    const data = await archiveCompany(request, companyId);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
