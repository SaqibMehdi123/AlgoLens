import { lessonDetail, type LessonDetail } from "@algolens/api-contracts";
import { locateLesson, tracks, flattenLessons } from "@algolens/content";
import { NextResponse } from "next/server";
import { problemResponse } from "@/lib/api";
import { readLessonSource } from "@/lib/content";

/** GET /api/v1/lessons/:slug — lesson metadata + MDX source. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  for (const track of tracks) {
    if (!flattenLessons(track).some((l) => l.slug === slug)) continue;
    const loc = locateLesson(track.slug, slug);
    if (!loc) continue;
    const body: LessonDetail = {
      slug: loc.lesson.slug,
      title: loc.lesson.title,
      summary: loc.lesson.summary,
      estMinutes: loc.lesson.estMinutes,
      difficulty: loc.lesson.difficulty,
      position: loc.lesson.position,
      quizCount: loc.lesson.quizCount,
      prerequisites: loc.lesson.prerequisites,
      practiceSlug: loc.lesson.practiceSlug,
      trackSlug: loc.track.slug,
      moduleSlug: loc.module.slug,
      contentMdx: readLessonSource(loc.lesson),
    };
    return NextResponse.json(lessonDetail.parse(body));
  }

  return problemResponse(404, "Lesson not found", `No published lesson with slug "${slug}".`);
}
