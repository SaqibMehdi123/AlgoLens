import { CATEGORY_LABELS, groupByCategory, registry } from "@algolens/algo-core";
import { Card } from "@algolens/ui";
import Link from "next/link";

export const metadata = {
  title: "Visualize",
  description: "Step through sorting, searching, tree, and graph algorithms with synced pseudocode.",
};

// ISR: catalog is static and revalidated periodically (roadmap Phase 1).
export const revalidate = 3600;

export default function VisualizeCatalog() {
  const groups = groupByCategory();
  return (
    <div className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Visualize</h1>
        <p className="mt-2 max-w-[64ch] text-secondary">
          {registry.length} algorithms across three layouts. Play, pause, scrub backward, and watch
          the pseudocode line that caused every move. No account needed.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.category} className="mb-10">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
            {CATEGORY_LABELS[group.category]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.entries.map((entry) => (
              <Link key={entry.key} href={`/visualize/${entry.key}`} className="group block">
                <Card className="h-full p-4 transition-colors group-hover:border-primary/60 group-hover:bg-raised">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium text-foreground">{entry.title}</h3>
                    <span className="shrink-0 font-mono text-xs text-secondary">
                      {entry.complexity.worst}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{entry.layout} layout</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
