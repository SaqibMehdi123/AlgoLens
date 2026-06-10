import { tracksResponse, type TracksResponse } from "@algolens/api-contracts";
import { flattenLessons, tracks } from "@algolens/content";
import { NextResponse } from "next/server";

/** GET /api/v1/tracks — curriculum catalog from the content manifest (content-in-repo v1). */
export function GET() {
  const body: TracksResponse = {
    tracks: tracks.map((t) => ({
      slug: t.slug,
      title: t.title,
      description: t.description,
      level: t.level,
      position: t.position,
      lessonCount: flattenLessons(t).length,
      modules: t.modules.map((m) => ({
        slug: m.slug,
        title: m.title,
        position: m.position,
        lessons: m.lessons.map((l) => ({
          slug: l.slug,
          title: l.title,
          summary: l.summary,
          estMinutes: l.estMinutes,
          difficulty: l.difficulty,
          position: l.position,
          quizCount: l.quizCount,
          prerequisites: l.prerequisites,
          practiceSlug: l.practiceSlug,
        })),
      })),
    })),
  };
  // Dogfood the contract: the response shape is validated before it leaves the server.
  return NextResponse.json(tracksResponse.parse(body));
}
