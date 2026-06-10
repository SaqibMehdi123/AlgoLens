import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <ComingSoon
      pillar="Learn"
      phase="Phase 2 · Roadmap"
      blurb="An MDX lesson curriculum with embedded visualizations, inline quizzes, and progress tracking — the Foundations track from Big-O to BFS/DFS."
      bullets={[
        "MDX pipeline with <Viz/>, <Quiz/>, and <Callout/> components",
        "Per-lesson progress (scroll + quiz pass) and track progress rings",
        "Wrong-answer → 'replay the visualization at the failing step' deep link",
      ]}
    />
  );
}
