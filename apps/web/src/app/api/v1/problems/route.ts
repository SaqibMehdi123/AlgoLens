import { problemSummary } from "@algolens/api-contracts";
import { problems } from "@algolens/content";
import { NextResponse } from "next/server";
import { z } from "zod";

/** GET /api/v1/problems — public catalog (summaries carry no cases at all). */
export function GET() {
  const body = problems.map((p) =>
    problemSummary.parse({
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      lessonSlug: p.lessonSlug,
    }),
  );
  return NextResponse.json(z.array(problemSummary).parse(body));
}
