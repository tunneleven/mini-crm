import { NextRequest } from "next/server";

import { handleApiError, jsonResponse } from "@/lib/api";
import { importResourceCsv } from "@/lib/crm/import-export";
import { parseImportResource } from "@/lib/crm/import-export-schemas";
import { resolveWorkspaceActor } from "@/lib/crm/workspace";

type ImportRouteProps = {
  params: Promise<{ resource: string }>;
};

export async function POST(request: NextRequest, { params }: ImportRouteProps) {
  try {
    const { workspaceId } = await resolveWorkspaceActor(request);
    const { resource } = await params;
    const parsedResource = parseImportResource(resource);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Upload a CSV file named `file`.");
    }

    const text = await file.text();
    const data = await importResourceCsv(workspaceId, parsedResource, text);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
