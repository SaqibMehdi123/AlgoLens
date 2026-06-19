import { db, lessons, userLessonProgress } from "@algolens/db";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { problemResponse } from "@/lib/api";

/**
 * GET /api/v1/progress — the signed-in user's lesson progress, keyed by lesson slug. Used to
 * hydrate a device on sign-in (the write side is PUT /api/v1/progress/lessons/:slug).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return problemResponse(401, "Authentication required", "Sign in to read synced progress.");
  }

  const rows = await db()
    .select({
      slug: lessons.slug,
      status: userLessonProgress.status,
      scrollPct: userLessonProgress.scrollPct,
      completedAt: userLessonProgress.completedAt,
    })
    .from(userLessonProgress)
    .innerJoin(lessons, eq(userLessonProgress.lessonId, lessons.id))
    .where(eq(userLessonProgress.userId, session.user.id));

  const out: Record<string, { status: string; scrollPct: number; completedAt: string | null }> = {};
  for (const r of rows) {
    out[r.slug] = {
      status: r.status,
      scrollPct: r.scrollPct,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    };
  }
  return Response.json({ lessons: out });
}
