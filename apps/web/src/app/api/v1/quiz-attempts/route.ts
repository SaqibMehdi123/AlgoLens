import { quizAttemptCreate } from "@algolens/api-contracts";
import { problemResponse } from "@/lib/api";

/**
 * POST /api/v1/quiz-attempts — validated per contract; persistence pending auth + DB
 * (same rationale as the progress route, see docs/adr/0003).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problemResponse(400, "Invalid JSON body");
  }
  const parsed = quizAttemptCreate.safeParse(body);
  if (!parsed.success) {
    return problemResponse(400, "Validation failed", parsed.error.issues[0]?.message);
  }

  return problemResponse(
    501,
    "Server-side quiz attempts not yet available",
    "Attempts are tracked on-device until accounts ship (docs/adr/0003).",
  );
}
