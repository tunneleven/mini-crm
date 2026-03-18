import { NextRequest } from "next/server";

import { handleApiError } from "@/lib/api";
import { exportResourceCsv } from "@/lib/crm/import-export";
import { parseImportResource } from "@/lib/crm/import-export-schemas";
import { resolveWorkspaceActor } from "@/lib/crm/workspace";

type ExportRouteProps = {
  params: Promise<{ resource: string }>;
};

export async function GET(request: NextRequest, { params }: ExportRouteProps) {
  try {
    const { workspaceId } = await resolveWorkspaceActor(request);
    const { resource } = await params;
    const parsedResource = parseImportResource(resource);
    const csv = await exportResourceCsv(workspaceId, parsedResource);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${parsedResource}-export.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
