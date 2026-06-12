import { submissionCreate } from "@algolens/api-contracts";
import { NextResponse } from "next/server";
import { problemResponse } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createSubmission } from "@/lib/submissions";

/**
 * POST /api/v1/submissions — Zod-validated, idempotency-keyed (TRD §7/§8).
 * The user's code is judged ONLY by the isolated child-process judge — never in this route's
 * process (rule 5). Returns 202 + id; progress streams on /submissions/:id/events.
 */
export async function POST(req: Request) {
  // Rate limit: 6 submissions/min per client (TRD §7).
  const rl = rateLimit(`submissions:${clientKey(req)}`, 6, 60_000);
  if (!rl.ok) {
    return problemResponse(429, "Too many submissions", "Limit is 6 per minute.", {
      "retry-after": String(Math.ceil(rl.resetMs / 1000)),
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problemResponse(400, "Invalid JSON body");
  }
  const parsed = submissionCreate.safeParse(body);
  if (!parsed.success) {
    return problemResponse(400, "Validation failed", parsed.error.issues[0]?.message);
  }
  if (parsed.data.language !== "javascript") {
    return problemResponse(501, "Language not yet supported", "Python arrives with Judge0 (TRD §6 P1).");
  }

  const created = createSubmission({
    problemSlug: parsed.data.problemSlug,
    sourceCode: parsed.data.sourceCode,
    idempotencyKey: parsed.data.idempotencyKey,
  });
  if ("error" in created) {
    return problemResponse(404, "Problem not found");
  }
  return NextResponse.json(
    { id: created.id, deduplicated: created.deduplicated },
    { status: created.deduplicated ? 200 : 202 },
  );
}
