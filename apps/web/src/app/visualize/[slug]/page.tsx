import { getAlgo, registry } from "@algolens/algo-core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
    <div className="py-6">
      <Link
        href="/visualize"
        className="inline-flex items-center gap-1 text-sm text-secondary transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        All algorithms
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{entry.title}</h1>
        <span className="font-mono text-sm text-secondary">
          avg {entry.complexity.average} · space {entry.complexity.space}
        </span>
      </div>

      <PlayerShell algoKey={slug} />

      <p className="mt-2 text-xs text-muted">
        Keyboard: <kbd className="font-mono">Space</kbd> play/pause ·{" "}
        <kbd className="font-mono">←/→</kbd> step · <kbd className="font-mono">↑/↓</kbd> speed
      </p>
    </div>
  );
}
