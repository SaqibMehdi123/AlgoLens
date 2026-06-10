import { progressPut } from "@algolens/api-contracts";
import { problemResponse } from "@/lib/api";

/**
 * PUT /api/v1/progress/lessons/:slug — server-side progress persistence.
 *
 * Validates per the contract, but persistence requires an authenticated user and a database
 * (PRD X1: progress requires an account; ADR-0003). Until Auth.js + Postgres are wired, clients
 * keep progress locally and this returns 501 — honestly, instead of silently dropping data.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problemResponse(400, "Invalid JSON body");
  }
  const parsed = progressPut.safeParse(body);
  if (!parsed.success) {
    return problemResponse(400, "Validation failed", parsed.error.issues[0]?.message);
  }

  return problemResponse(
    501,
    "Server-side progress not yet available",
    `Progress for "${slug}" is stored on-device until accounts ship (see docs/adr/0003). ` +
      "The request body was valid — this endpoint will accept it unchanged once persistence lands.",
  );
}
