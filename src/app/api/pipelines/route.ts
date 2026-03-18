import { NextRequest } from "next/server";

import { handleApiError, jsonResponse } from "@/lib/api";
import { listPipelines } from "@/lib/crm/service";

export async function GET(request: NextRequest) {
  try {
    const data = await listPipelines(request);
    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
