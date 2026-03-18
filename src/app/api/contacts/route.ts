import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { collectionQuerySchema, contactCreateSchema } from "@/lib/crm/schemas";
import { createContact, listContacts } from "@/lib/crm/service";

export async function GET(request: NextRequest) {
  try {
    const input = collectionQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      includeArchived: request.nextUrl.searchParams.get("includeArchived") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const data = await listContacts(request, input);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseRequestBody(request, contactCreateSchema);
    const data = await createContact(request, input);
    return jsonResponse({ item: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
