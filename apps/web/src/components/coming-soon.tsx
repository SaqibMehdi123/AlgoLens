import { Card } from "@algolens/ui";
import Link from "next/link";

export interface ComingSoonProps {
  pillar: string;
  phase: string;
  blurb: string;
  bullets: string[];
}

/** Honest placeholder for pillars not yet built this session — links back to the live visualizer. */
export function ComingSoon({ pillar, phase, blurb, bullets }: ComingSoonProps) {
  return (
    <div className="py-16">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">{phase}</p>
      <h1 className="text-3xl font-bold tracking-[-0.02em]">{pillar}</h1>
      <p className="mt-3 max-w-[60ch] text-secondary">{blurb}</p>
      <Card className="mt-8 max-w-[60ch]">
        <ul className="flex flex-col gap-2 p-5 text-sm text-secondary">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-primary">→</span>
              {b}
            </li>
          ))}
        </ul>
      </Card>
      <Link
        href="/visualize"
        className="mt-8 inline-block rounded-lg bg-primary px-4 py-2 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Explore the live visualizer →
      </Link>
    </div>
  );
}
