import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
}));

const mockHeaders = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

import { ApiError } from "@/lib/api";
import { resolveWorkspaceActor, resolveWorkspaceIdFromServer } from "@/lib/crm/workspace";

describe("workspace helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("resolves a workspace actor from request headers", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "kira-sloan",
      name: "Kira Sloan",
      role: "ADMIN",
    });

    const actor = await resolveWorkspaceActor({
      headers: new Headers({
        "x-workspace-id": "northstar-labs",
        "x-user-id": "kira-sloan",
      }),
    } as never);

    expect(actor).toMatchObject({
      workspaceId: "northstar-labs",
      userId: "kira-sloan",
      userName: "Kira Sloan",
      role: "ADMIN",
    });
  });

  it("reads the workspace id from server headers", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "x-workspace-id": "northstar-labs",
      }),
    );

    await expect(resolveWorkspaceIdFromServer()).resolves.toBe("northstar-labs");
  });

  it("throws when workspace headers are missing", async () => {
    await expect(
      resolveWorkspaceActor({
        headers: new Headers(),
      } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
