import { problem, type ProblemJson } from "@algolens/api-contracts";
import { NextResponse } from "next/server";

/** RFC 7807 response helper — every API error leaves as application/problem+json (TRD §8). */
export function problemResponse(status: number, title: string, detail?: string) {
  const body: ProblemJson = problem(status, title, detail);
  return NextResponse.json(body, {
    status,
    headers: { "content-type": "application/problem+json" },
  });
}
