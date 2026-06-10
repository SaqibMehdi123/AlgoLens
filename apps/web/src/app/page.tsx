import { Activity, FlaskConical, Play } from "lucide-react";
import Link from "next/link";
import { HeroViz } from "@/components/hero-viz";

const features = [
  {
    icon: Play,
    title: "Visualize",
    body: "Every algorithm is a generator that yields typed steps. The player is a pure function of (trace, frame) — so backward stepping is exact, scrubbing is instant, and the pseudocode line that caused each move is always highlighted.",
    href: "/visualize",
    cta: "Open the playground",
  },
  {
    icon: Activity,
    title: "Analyze",
    body: "Paste a function and get an honest complexity estimate: static AST analysis and empirical curve-fitting side by side, each with its confidence. When they disagree, we show you — never a single overconfident oracle.",
    href: "/analyze",
    cta: "See the Complexity Lab",
  },
  {
    icon: FlaskConical,
    title: "Practice",
    body: "Solve problems in the browser, run sample tests instantly in a sandboxed worker, then submit for server-side judging with per-case verdicts. Hidden tests never touch the client.",
    href: "/practice",
    cta: "Browse problems",
  },
];

export default function Home() {
  return (
    <div className="pb-24">
      <section className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            See the algorithm.
            <br />
            <span className="text-primary">Prove the complexity.</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg text-secondary">
            AlgoLens is where developers learn data structures &amp; algorithms by watching them run,
            measuring how they scale, and practicing until it sticks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/visualize"
              className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Start learning — free
            </Link>
            <Link
              href="/visualize/merge-sort"
              className="rounded-lg border border-subtle px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-raised"
            >
              Watch merge sort →
            </Link>
          </div>
        </div>
        <HeroViz />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, body, href, cta }) => (
          <div key={title} className="rounded-xl border border-subtle bg-surface p-6">
            <Icon className="size-6 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{body}</p>
            <Link
              href={href}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              {cta} →
            </Link>
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-2xl border border-subtle bg-surface p-8 text-center sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          Watch it, prove it, then write it.
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-secondary">
          One visualization engine connects learning, analysis, and practice — so context is never
          lost between sites.
        </p>
        <Link
          href="/visualize"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Explore the catalog
        </Link>
      </section>
    </div>
  );
}
