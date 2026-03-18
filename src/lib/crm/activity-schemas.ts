import { z } from "zod";

function emptyStringToNull(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
}

const recordTargetTypeSchema = z.enum(["contact", "company", "deal"]);
const recordTargetIdSchema = z.string().trim().min(1).max(120);
const optionalTargetType = recordTargetTypeSchema.optional();
const optionalTargetId = z.preprocess(emptyStringToNull, recordTargetIdSchema.optional());
const optionalDateTime = z.preprocess(
  emptyStringToNull,
  z.string().datetime({ offset: true }).optional().nullable(),
);
const optionalAssigneeId = z.preprocess(emptyStringToNull, z.string().trim().min(1).max(120).optional().nullable());

const targetPairRefinement = <
  T extends z.ZodRawShape & {
    targetType: typeof optionalTargetType;
    targetId: typeof optionalTargetId;
  },
>(
  schema: z.ZodObject<T>,
) =>
  schema.superRefine((value, ctx) => {
    const typedValue = value as {
      targetType?: unknown;
      targetId?: unknown;
    };
    const targetType = typedValue.targetType;
    const targetId = typedValue.targetId;

    if (Boolean(targetType) !== Boolean(targetId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target type and target ID must be provided together.",
        path: ["targetType"],
      });
    }
  });

export const noteCreateSchema = targetPairRefinement(
  z.object({
    targetType: optionalTargetType,
    targetId: optionalTargetId,
    body: z.string().trim().min(1).max(5_000),
  }),
);

export const activityTypeSchema = z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "TASK", "STAGE_CHANGE"]);

export const activityCreateSchema = targetPairRefinement(
  z.object({
    targetType: optionalTargetType,
    targetId: optionalTargetId,
    type: activityTypeSchema,
    summary: z.string().trim().min(1).max(5_000),
    happenedAt: optionalDateTime,
  }),
);

export const taskCreateSchema = z.object({
  targetType: optionalTargetType,
  targetId: optionalTargetId,
  title: z.string().trim().min(1).max(240),
  dueAt: optionalDateTime,
  assigneeId: optionalAssigneeId,
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  dueAt: optionalDateTime,
  assigneeId: optionalAssigneeId,
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
});

export const taskQuerySchema = z.object({
  targetType: optionalTargetType,
  targetId: optionalTargetId,
  includeCompleted: z.coerce.boolean().optional().default(false),
});

export type RecordTargetType = z.infer<typeof recordTargetTypeSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

export type RecordTarget = {
  type: RecordTargetType;
  id: string;
};
