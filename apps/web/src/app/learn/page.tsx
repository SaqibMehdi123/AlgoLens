import { tracks } from "@algolens/content";
import { Layers, Network } from "lucide-react";
import { TrackCard } from "@/components/learn/track-progress";

export const metadata = {
  title: "Learn",
  description:
    "Interactive DSA lessons with embedded visualizations and quizzes — from Big-O to graph traversal.",
};

const comingSoon = [
  { title: "Dynamic Programming", desc: "Memoization, tabulation, and the classic DP patterns.", icon: Layers },
  { title: "Graphs, Advanced", desc: "Shortest paths, MSTs, flows, and union-find.", icon: Network },
];

export default function LearnCatalog() {
  return (
    <div className="mx-auto w-full max-w-[1080px] py-10">
      <div className="mb-2.5 font-mono text-xs uppercase tracking-[0.15em] text-primary">// curriculum</div>
      <h1 className="text-[34px] font-bold tracking-[-0.02em] text-foreground">Tracks</h1>
      <p className="mt-2 max-w-[560px] text-base text-secondary">
        Structured paths through data structures and algorithms, each lesson built around an
        interactive visualization.
      </p>

      <div className="mt-8 flex flex-col gap-[18px]">
        {tracks.map((track) => (
          <TrackCard key={track.slug} track={track} />
        ))}
      </div>

      <div className="mt-[18px] grid gap-[18px] sm:grid-cols-2">
        {comingSoon.map(({ title, desc, icon: Icon }) => (
          <div key={title} className="rounded-2xl border border-subtle bg-surface p-[22px] opacity-60">
            <div className="mb-2.5 flex items-center gap-3">
              <div className="grid size-[42px] place-items-center rounded-xl bg-raised text-muted">
                <Icon className="size-[18px]" />
              </div>
              <span className="rounded-md border border-border-strong px-2 py-0.5 font-mono text-[11px] text-muted">
                coming soon
              </span>
            </div>
            <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-secondary">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
