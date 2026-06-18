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
    <div className="mx-auto w-full max-w-[1000px] py-9">
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-primary">
        // {problems.length} problems
      </div>
      <h1 className="text-[32px] font-bold tracking-[-0.02em] text-foreground">Practice</h1>
      <p className="mt-2 max-w-[620px] text-base text-secondary">
        Linked to the Foundations track. Samples run instantly in your browser; submissions are
        judged in an isolated sandbox with hidden test cases.
      </p>
      <div className="mt-7">
        <ProblemList problems={summaries} />
      </div>
    </div>
  );
}
