import { tracks } from "@algolens/content";
import { TrackCard } from "@/components/learn/track-progress";

export const metadata = {
  title: "Learn",
  description:
    "Interactive DSA lessons with embedded visualizations and quizzes — from Big-O to graph traversal.",
};

export default function LearnCatalog() {
  return (
    <div className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Learn</h1>
        <p className="mt-2 max-w-[64ch] text-secondary">
          Lessons where every concept is a visualization you can scrub, and every quiz that trips
          you up links back to the exact step that explains it.
        </p>
      </header>
      <div className="grid gap-4 lg:max-w-3xl">
        {tracks.map((track) => (
          <TrackCard key={track.slug} track={track} />
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        The Foundations track ships its three exemplar lessons first — the remaining lessons follow
        the same template in the content sprint (roadmap Phase 2).
      </p>
    </div>
  );
}
