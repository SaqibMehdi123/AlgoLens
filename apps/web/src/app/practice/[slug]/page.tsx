import { allStarters, getProblem, problems, problemSignature } from "@algolens/content";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const DIFF_COLOR: Record<string, string> = {
  intro: "var(--viz-sorted)",
  easy: "var(--viz-swap)",
  medium: "var(--viz-compare)",
  hard: "var(--viz-pivot)",
};
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Workspace } from "@/components/practice/workspace";

export function generateStaticParams() {
  return problems.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProblem(slug);
  return p ? { title: p.title, description: `Practice problem: ${p.title}` } : { title: "Practice" };
}

/**
 * Problem workspace (docs/05 §5.6). The full problem definition (incl. hidden cases) exists only
 * here on the server; the client receives the signature, generated starter stubs, and samples.
 */
export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProblem(slug);
  if (!p) notFound();

  const samples = p.cases
    .filter((c) => c.isSample)
    .map((c) => ({ args: c.args, expected: c.expected }));

  return (
    <div className="mx-auto w-full max-w-[1280px] py-6">
      <Link
        href="/practice"
        className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All problems
      </Link>
      <div className="mb-5 mt-4 flex flex-wrap items-center gap-2.5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">{p.title}</h1>
        <span
          className="rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold capitalize"
          style={{ borderColor: DIFF_COLOR[p.difficulty], color: DIFF_COLOR[p.difficulty] }}
        >
          {p.difficulty}
        </span>
      </div>

      <Workspace
        slug={p.slug}
        difficulty={p.difficulty}
        tags={p.tags}
        functionName={p.functionName}
        signature={problemSignature(p)}
        starterCode={allStarters(p)}
        samples={samples}
        hiddenCaseCount={p.cases.filter((c) => !c.isSample).length}
        timeLimitMs={p.timeLimitMs}
        compare={p.compare}
        lessonSlug={p.lessonSlug}
        statement={<ReactMarkdown remarkPlugins={[remarkGfm]}>{p.statementMd}</ReactMarkdown>}
      />
    </div>
  );
}
