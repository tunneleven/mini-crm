import { describe, expect, it } from "vitest";

import {
  activityCreateSchema,
  noteCreateSchema,
  taskCreateSchema,
  taskQuerySchema,
  taskUpdateSchema,
} from "@/lib/crm/activity-schemas";

describe("activity schemas", () => {
  it("requires target type and id together for notes and activities", () => {
    expect(() =>
      noteCreateSchema.parse({
        targetType: "contact",
        body: "Need legal review",
      }),
    ).toThrow();

    expect(() =>
      activityCreateSchema.parse({
        targetId: "deal-1",
        type: "CALL",
        summary: "Held call",
      }),
    ).toThrow();
  });

  it("parses task create, update, and query payloads", () => {
    expect(
      taskCreateSchema.parse({
        targetType: "deal",
        targetId: "deal-1",
        title: "Send recap",
        dueAt: "",
        assigneeId: "",
      }),
    ).toEqual({
      targetType: "deal",
      targetId: "deal-1",
      title: "Send recap",
      dueAt: null,
      assigneeId: null,
    });

    expect(
      taskUpdateSchema.parse({
        title: "Update proposal",
        status: "DONE",
      }),
    ).toEqual({
      title: "Update proposal",
      status: "DONE",
    });

    expect(taskQuerySchema.parse({ includeCompleted: "true" })).toEqual({
      includeCompleted: true,
    });
  });
});
