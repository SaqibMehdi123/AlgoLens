import { gradeRequest } from "@algolens/api-contracts";
import { problemResponse } from "@/lib/api";

/**
 * POST /api/v1/reviews/:cardId/grade — grade a due card. The SM-2 scheduling itself is pure
 * (@algolens/retention) and runs client-side against the device-local deck (ADR-0003/0005);
 * this route validates the contract and returns 501 until per-user cards are DB-backed.
 */
export async function POST(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problemResponse(400, "Invalid JSON body");
  }
  const parsed = gradeRequest.safeParse(body);
  if (!parsed.success) {
    return problemResponse(400, "Validation failed", parsed.error.issues[0]?.message);
  }
  return problemResponse(
    501,
    "Server-side review grading not yet available",
    `Card "${cardId}" is scheduled on-device until accounts ship (docs/adr/0003).`,
  );
}
