import { locateLesson, tracks, flattenLessons } from "@algolens/content";
import { compileMDX } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";
import { Callout } from "@/components/mdx/callout";
import { Quiz } from "@/components/mdx/quiz";
import { Viz } from "@/components/mdx/viz";
import { LessonShell } from "@/components/learn/lesson-shell";
import { readLessonSource } from "@/lib/content";

interface Params {
  track: string;
  lesson: string;
}

export function generateStaticParams(): Params[] {
  return tracks.flatMap((t) =>
    flattenLessons(t).map((l) => ({ track: t.slug, lesson: l.slug })),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { track, lesson } = await params;
  const loc = locateLesson(track, lesson);
  if (!loc) return { title: "Learn" };
  return {
    title: loc.lesson.title,
    description: loc.lesson.summary,
    openGraph: {
      title: `${loc.lesson.title} · AlgoLens`,
      description: loc.lesson.summary,
      type: "article",
    },
  };
}

/**
 * Lesson reader (docs/05 §5.5). MDX is compiled server-side from repo content; only the
 * allowlisted components below are available to lessons — no raw HTML pipeline (rule 4/7).
 */
export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { track, lesson } = await params;
  const loc = locateLesson(track, lesson);
  if (!loc) notFound();

  const source = readLessonSource(loc.lesson);

  // Compile MDX to an already-resolved node here (server), then pass it as children. Passing the
  // resolved content — rather than the async <MDXRemote/> element — into the client LessonShell
  // avoids the next-mdx-remote × Next-15.5 dev-runtime crash. Components are allowlisted (rule 4).
  const { content } = await compileMDX({
    source,
    components: { Viz, Quiz, Callout },
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  return (
    <LessonShell track={loc.track} lesson={loc.lesson} next={loc.next}>
      {content}
    </LessonShell>
  );
}
