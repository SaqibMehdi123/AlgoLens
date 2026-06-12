import { problemResponse } from "@/lib/api";

/**
 * GET /api/v1/reviews/due — the due queue. Cards live on-device until accounts ship
 * (ADR-0003/0005); the /review UI reads them locally. This endpoint reserves the route and
 * returns 501 until per-user persistence exists.
 */
export function GET() {
  return problemResponse(
    501,
    "Server-side review queue not yet available",
    "The /review page reads your device-local deck directly (docs/adr/0003).",
  );
}
