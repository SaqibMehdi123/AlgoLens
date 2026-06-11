import { NextResponse } from "next/server";
import { problemResponse } from "@/lib/api";
import { getSubmission } from "@/lib/submissions";

/** GET /api/v1/submissions/:id — current submission state (poll fallback for SSE). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = getSubmission(id);
  if (!view) return problemResponse(404, "Submission not found");
  return NextResponse.json(view);
}
