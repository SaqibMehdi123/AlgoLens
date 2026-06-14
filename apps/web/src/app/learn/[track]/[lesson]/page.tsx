import { evaluate } from "@mdx-js/mdx";
import { flattenLessons, locateLesson, tracks } from "@algolens/content";
import { notFound } from "next/navigation";
import * as jsxRuntime from "react/jsx-runtime";
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
  return tracks.flatMap((t) => flattenLessons(t).map((l) => ({ track: t.slug, lesson: l.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { track, lesson } = await params;
  const loc = locateLesson(track, lesson);
  if (!loc) return { title: "Learn" };
  return {
    title: loc.lesson.title,
    description: loc.lesson.summary,
    openGraph: { title: `${loc.lesson.title} · AlgoLens`, description: loc.lesson.summary, type: "article" },
  };
}

/**
 * Lesson reader (docs/05 §5.5). MDX is compiled with @mdx-js/mdx `evaluate`, passing the
 * PRODUCTION JSX runtime (`react/jsx-runtime`) and `development:false` explicitly — even under
 * `next dev`. That sidesteps the next-mdx-remote × Next-15.5 `jsxDEV` mismatch so lessons render
 * in dev and prod alike. Only the allowlisted components are available to lessons (rule 4); the
 * source is repo-authored/trusted (ADR-0003).
 */
export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { track, lesson } = await params;
  const loc = locateLesson(track, lesson);
  if (!loc) notFound();

  const source = readLessonSource(loc.lesson);
  const { default: Content } = await evaluate(source, {
    ...jsxRuntime,
    development: false,
    remarkPlugins: [remarkGfm],
  } as Parameters<typeof evaluate>[1]);

  return (
    <LessonShell track={loc.track} lesson={loc.lesson} next={loc.next}>
      <Content components={{ Viz, Quiz, Callout }} />
    </LessonShell>
  );
}
