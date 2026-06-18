import { CATEGORY_LABELS, groupByCategory, registry } from "@algolens/algo-core";
import Link from "next/link";

export const metadata = {
  title: "Visualize",
  description: "Step through sorting, searching, tree, and graph algorithms with synced pseudocode.",
};

// ISR: catalog is static and revalidated periodically (roadmap Phase 1).
export const revalidate = 3600;

// Each category gets a fixed semantic accent (from the design system's state palette).
const ACCENT: Record<string, string> = {
  searching: "var(--viz-compare)",
  sorting: "var(--viz-swap)",
  tree: "var(--viz-sorted)",
  graph: "var(--viz-frontier)",
};

function Preview({ layout, accent }: { layout: string; accent: string }) {
  if (layout === "array") {
    const vals = [30, 55, 22, 70, 42, 60, 35, 48];
    return (
      <div className="flex h-[62px] items-end gap-1">
        {vals.map((v, i) => {
          const on = i === 2 || i === 3;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ height: `${v}%`, background: on ? accent : "var(--viz-range)", opacity: on ? 1 : 0.6 }}
            />
          );
        })}
      </div>
    );
  }
  if (layout === "tree") {
    const node = (c: string) => (
      <span
        className="size-5 rounded-full border"
        style={{ borderColor: c, background: "var(--elevated)" }}
      />
    );
    return (
      <div className="flex h-[62px] flex-col items-center justify-center gap-2">
        {node(accent)}
        <div className="h-px w-[46px]" style={{ background: "var(--border-strong)" }} />
        <div className="flex gap-[26px]">
          {node("var(--muted-fg)")}
          {node("var(--muted-fg)")}
        </div>
      </div>
    );
  }
  // graph
  const dot = (c: string, l: number, t: number) => (
    <span className="absolute size-4 rounded-full" style={{ left: l, top: t, background: c }} />
  );
  const edge = (l: number, t: number, w: number, r: number) => (
    <span
      className="absolute h-[1.5px] origin-left"
      style={{ left: l, top: t, width: w, transform: `rotate(${r}deg)`, background: "var(--border-strong)" }}
    />
  );
  return (
    <div className="relative h-[62px]">
      {edge(26, 16, 40, 28)}
      {edge(26, 16, 44, -6)}
      {edge(70, 40, 30, -40)}
      {dot(accent, 18, 8)}
      {dot("var(--muted-fg)", 60, 34)}
      {dot("var(--muted-fg)", 68, 4)}
      {dot("var(--muted-fg)", 96, 18)}
    </div>
  );
}

export default function VisualizeCatalog() {
  const groups = groupByCategory();
  return (
    <div className="mx-auto w-full max-w-[1120px] py-10">
      <div className="mb-2.5 font-mono text-xs uppercase tracking-[0.15em] text-primary">
        // {registry.length} algorithms
      </div>
      <h1 className="text-[34px] font-bold tracking-[-0.02em] text-foreground">Visualize</h1>
      <p className="mt-2 max-w-[560px] text-base text-secondary">
        Pick an algorithm and step through it on your own input. Every player shares the same engine,
        controls, and state language.
      </p>

      <div className="mt-9 flex flex-col gap-8">
        {groups.map((group) => {
          const accent = ACCENT[group.category] ?? "var(--primary)";
          return (
            <section key={group.category}>
              <div className="mb-3.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-secondary">
                {CATEGORY_LABELS[group.category]} · {group.entries.length}
              </div>
              <div
                className="grid gap-3.5"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
              >
                {group.entries.map((entry) => (
                  <Link
                    key={entry.key}
                    href={`/visualize/${entry.key}`}
                    className="lift block overflow-hidden rounded-[14px] border border-subtle bg-surface p-[18px]"
                  >
                    <div className="mb-3.5 rounded-[10px] border border-subtle bg-elevated p-3">
                      <Preview layout={entry.layout} accent={accent} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold text-foreground">{entry.title}</span>
                      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11.5px] font-semibold text-primary">
                        {entry.complexity.worst}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
