import { problems } from "@algolens/content";
import { ProblemList } from "@/components/practice/problem-list";

export const metadata = {
  title: "Practice",
  description:
    "Solve DSA problems in the browser: instant sample runs, sandboxed judging with per-case verdicts.",
};

export default function PracticePage() {
  const summaries = problems.map((p) => ({
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    tags: p.tags,
    lessonSlug: p.lessonSlug,
  }));

  return (
    <div className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Practice</h1>
        <p className="mt-2 max-w-[64ch] text-secondary">
          {problems.length} problems linked to the Foundations track. Samples run instantly in your
          browser; submissions are judged in an isolated sandbox with hidden test cases.
        </p>
      </header>
      <ProblemList problems={summaries} />
    </div>
  );
}
