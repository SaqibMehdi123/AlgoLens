import { allStarters, getProblem, problems, problemSignature } from "@algolens/content";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
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
    <div className="py-6">
      <Link
        href="/practice"
        className="inline-flex items-center gap-1 text-sm text-secondary transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        All problems
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{p.title}</h1>
        <span className="font-mono text-sm text-secondary">{p.difficulty}</span>
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
