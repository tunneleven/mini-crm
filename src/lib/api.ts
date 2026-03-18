import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse(
      {
        error: {
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return jsonResponse(
      {
        error: {
          message: "Request validation failed.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  console.error(error);

  return jsonResponse(
    {
      error: {
        message: "Internal server error.",
      },
    },
    { status: 500 },
  );
}

export async function parseRequestBody<TSchema extends ZodType>(
  request: NextRequest,
  schema: TSchema,
) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }

  return schema.parse(payload);
}
