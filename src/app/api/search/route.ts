import { NextRequest } from "next/server";

import { handleApiError, jsonResponse } from "@/lib/api";
import { searchQuerySchema } from "@/lib/crm/schemas";
import { searchRecords } from "@/lib/crm/service";

export async function GET(request: NextRequest) {
  try {
    const input = searchQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const data = await searchRecords(request, input);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
