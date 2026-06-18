import { getAlgo, registry } from "@algolens/algo-core";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerShell } from "@/components/visualizer/player-shell";

export function generateStaticParams() {
  return registry.map((entry) => ({ slug: entry.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAlgo(slug);
  if (!entry) return { title: "Visualize" };
  return {
    title: entry.title,
    description: `Watch ${entry.title} run step by step — ${entry.complexity.average} average time.`,
  };
}

export default async function VisualizePlayground({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getAlgo(slug);
  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-[1280px] py-6">
      <Link
        href="/visualize"
        className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All algorithms
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">{entry.title}</h1>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11.5px] font-semibold text-primary">
          avg {entry.complexity.average}
        </span>
        <span className="rounded-md bg-raised px-2 py-0.5 font-mono text-[11.5px] text-secondary">
          space {entry.complexity.space}
        </span>
      </div>

      <div className="mt-5">
        <PlayerShell algoKey={slug} />
      </div>

      <p className="mt-2 text-xs text-muted">
        Keyboard: <kbd className="font-mono">Space</kbd> play/pause ·{" "}
        <kbd className="font-mono">←/→</kbd> step · <kbd className="font-mono">↑/↓</kbd> speed
      </p>
    </div>
  );
}
