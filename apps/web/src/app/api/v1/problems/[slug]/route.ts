import { problemDetail } from "@algolens/api-contracts";
import { getProblem } from "@algolens/content";
import { NextResponse } from "next/server";
import { problemResponse } from "@/lib/api";

/**
 * GET /api/v1/problems/:slug — statement + SAMPLE cases only.
 * Hidden cases (is_sample=false) are filtered before serialization and the response is parsed
 * through a schema that has no field they could ride in (rule 6; leak-tested).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProblem(slug);
  if (!p) return problemResponse(404, "Problem not found", `No problem with slug "${slug}".`);

  const body = problemDetail.parse({
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    tags: p.tags,
    lessonSlug: p.lessonSlug,
    statementMd: p.statementMd,
    starterCode: p.starterCode,
    timeLimitMs: p.timeLimitMs,
    samples: p.cases.filter((c) => c.isSample).map((c) => ({ input: c.input, expected: c.expected })),
    hiddenCaseCount: p.cases.filter((c) => !c.isSample).length,
  });
  return NextResponse.json(body);
}
