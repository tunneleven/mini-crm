import { z } from "zod";
import { describe, expect, it } from "vitest";

import { ApiError, handleApiError, parseRequestBody } from "@/lib/api";

describe("api helpers", () => {
  it("serializes ApiError responses", async () => {
    const response = handleApiError(new ApiError(403, "Forbidden"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({
      error: {
        message: "Forbidden",
        details: null,
      },
    });
  });

  it("parses request bodies with the provided schema", async () => {
    const request = {
      json: async () => ({ title: "Northline rollout" }),
    } as never;

    const result = await parseRequestBody(
      request,
      z.object({
        title: z.string().min(1),
      }),
    );

    expect(result.title).toBe("Northline rollout");
  });
});
