import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Analyze" };

export default function AnalyzePage() {
  return (
    <ComingSoon
      pillar="Complexity Lab"
      phase="Phase 3 · Roadmap"
      blurb="Paste a function and get an honest complexity estimate: static AST analysis plus empirical curve-fitting, always shown with method and confidence — never a single overconfident oracle."
      bullets={[
        "Static analyzer (loop nesting, halving detection, recurrence → Master theorem)",
        "Empirical worker: geometric n schedule, least-squares fit, log-log growth chart",
        "Divergence card when layers disagree — honesty is a design feature",
      ]}
    />
  );
}
