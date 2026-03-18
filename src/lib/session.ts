export type WorkspaceSession = {
  workspaceId: string;
  workspaceName: string;
  userId: string;
  userName: string;
  role: "ADMIN" | "MEMBER";
};

export function getWorkspaceSession(): WorkspaceSession {
  return {
    workspaceId: "northstar-labs",
    workspaceName: "Northstar Labs",
    userId: "kira-sloan",
    userName: "Kira Sloan",
    role: "ADMIN",
  };
}
