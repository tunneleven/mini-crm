import { NextRequest } from "next/server";

import { handleApiError, jsonResponse, parseRequestBody } from "@/lib/api";
import { contactUpdateSchema } from "@/lib/crm/schemas";
import { archiveContact, getContact, updateContact } from "@/lib/crm/service";

type ContactRouteProps = {
  params: Promise<{ contactId: string }>;
};

export async function GET(request: NextRequest, { params }: ContactRouteProps) {
  try {
    const { contactId } = await params;
    const data = await getContact(request, contactId);
    return jsonResponse({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: ContactRouteProps) {
  try {
    const { contactId } = await params;
    const input = await parseRequestBody(request, contactUpdateSchema);
    const data = await updateContact(request, contactId, input);
    return jsonResponse({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: ContactRouteProps) {
  try {
    const { contactId } = await params;
    const data = await archiveContact(request, contactId);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
