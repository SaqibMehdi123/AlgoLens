import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/v1/health — liveness probe (TRD §0 / roadmap Phase 0). */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "algolens-web",
    version: process.env.npm_package_version ?? "0.0.0",
    time: new Date().toISOString(),
  });
}
