import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { collectionQuerySchema, companyCreateSchema } from "@/lib/crm/schemas";
import { createCompany, listCompanies } from "@/lib/crm/service";

export async function GET(request: NextRequest) {
  try {
    const input = collectionQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      includeArchived: request.nextUrl.searchParams.get("includeArchived") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const data = await listCompanies(request, input);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseRequestBody(request, companyCreateSchema);
    const data = await createCompany(request, input);
    return jsonResponse({ item: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
