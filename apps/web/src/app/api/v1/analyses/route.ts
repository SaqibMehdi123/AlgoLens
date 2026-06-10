import { analysisCreate } from "@algolens/api-contracts";
import { problemResponse } from "@/lib/api";

/**
 * POST /api/v1/analyses — save/share a finished analysis.
 *
 * The analysis itself ALWAYS runs client-side in the bench worker (rule 5 — this route never
 * executes user code). Persistence needs Postgres and the 10/min Redis rate limit (TRD §7);
 * neither is provisioned yet, so this validates and returns 501 per ADR-0003.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problemResponse(400, "Invalid JSON body");
  }
  const parsed = analysisCreate.safeParse(body);
  if (!parsed.success) {
    return problemResponse(400, "Validation failed", parsed.error.issues[0]?.message);
  }

  return problemResponse(
    501,
    "Saving analyses not yet available",
    "Results stay in your browser until persistence ships (docs/adr/0003). " +
      "The request body was valid and will be accepted unchanged once it does.",
  );
}
