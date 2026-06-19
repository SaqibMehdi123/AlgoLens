import { progressPut } from "@algolens/api-contracts";
import { db, lessons, userLessonProgress } from "@algolens/db";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { problemResponse } from "@/lib/api";

/**
 * PUT /api/v1/progress/lessons/:slug — durable, per-user lesson progress (ADR-0003 transport swap).
 *
 * Signed-in: upserts `user_lesson_progress` keyed by (userId, lessonId). Signed-out: 401 — the
 * client keeps progress on-device and only syncs once there's an account to attach it to.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return problemResponse(401, "Authentication required", "Sign in to sync progress across devices.");
  }

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

  const [lesson] = await db()
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.slug, slug))
    .limit(1);
  if (!lesson) {
    return problemResponse(404, "Lesson not found", `No published lesson "${slug}".`);
  }

  const { status, scrollPct } = parsed.data;
  await db()
    .insert(userLessonProgress)
    .values({
      userId: session.user.id,
      lessonId: lesson.id,
      status,
      scrollPct,
      completedAt: status === "completed" ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [userLessonProgress.userId, userLessonProgress.lessonId],
      set: {
        status,
        scrollPct,
        // Preserve the original completion timestamp once set.
        completedAt:
          status === "completed"
            ? sql`coalesce(${userLessonProgress.completedAt}, now())`
            : null,
        updatedAt: new Date(),
      },
    });

  return Response.json({ ok: true, slug, status, scrollPct }, { status: 200 });
}
