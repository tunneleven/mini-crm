import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = new Set(["/favicon.ico"]);

export function proxy(request: NextRequest) {
  if (publicPaths.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.set("x-workspace-id", "northstar-labs");
  headers.set("x-user-id", "kira-sloan");

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
