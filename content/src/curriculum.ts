import type { TrackMeta, LessonMeta } from "./types";

/**
 * The DSA Foundations track (PRD B3). Phase 2 ships the three exemplar lessons that lock the
 * template (roadmap: "write 3 exemplar lessons first — Big-O, Binary Search, BFS — then batch");
 * the remaining ~22 lessons are content-sprint work that follows the locked template.
 */
export const foundationsTrack: TrackMeta = {
  slug: "dsa-foundations",
  title: "DSA Foundations",
  description:
    "From 'what is Big-O?' to graph traversal — the core ideas every other algorithm builds on, taught through runnable visualizations.",
  level: "intro",
  position: 1,
  modules: [
    {
      slug: "complexity",
      title: "Thinking in Complexity",
      position: 1,
      lessons: [
        {
          slug: "big-o-notation",
          title: "Big-O Notation",
          summary:
            "Why counting steps beats timing seconds, and how growth classes let you predict performance before you run anything.",
          file: "big-o-notation.mdx",
          estMinutes: 10,
          difficulty: "intro",
          position: 1,
          quizCount: 2,
          prerequisites: [],
          practiceSlug: "count-pairs-with-sum",
          reviewCards: [
            { front: "What does Big-O measure?", back: "Asymptotic growth in **operations** as input size n grows — not wall-clock seconds." },
            { front: "Combine two nested loops over the same input.", back: "Nesting multiplies: n · n = O(n²). Sequential loops take the max." },
          ],
        },
      ],
    },
    {
      slug: "searching",
      title: "Searching",
      position: 2,
      lessons: [
        {
          slug: "binary-search",
          title: "Binary Search",
          summary:
            "Halve the search space every step: the algorithm that turns a million-element scan into twenty comparisons.",
          file: "binary-search.mdx",
          estMinutes: 12,
          difficulty: "intro",
          position: 1,
          quizCount: 2,
          prerequisites: ["big-o-notation"],
          practiceSlug: "binary-search-position",
          reviewCards: [
            { front: "Time complexity of binary search?", back: "O(log n) — each comparison halves the search window." },
            { front: "What precondition does binary search require?", back: "A **sorted** array. On unsorted data it fails silently." },
          ],
        },
      ],
    },
    {
      slug: "graphs-intro",
      title: "Graph Traversal",
      position: 3,
      lessons: [
        {
          slug: "breadth-first-search",
          title: "Breadth-First Search",
          summary:
            "Explore a graph in expanding rings with a queue — and get shortest paths in unweighted graphs for free.",
          file: "breadth-first-search.mdx",
          estMinutes: 12,
          difficulty: "easy",
          position: 1,
          quizCount: 2,
          prerequisites: ["big-o-notation"],
          practiceSlug: null,
          reviewCards: [
            { front: "Which data structure drives BFS, and why?", back: "A **queue** (FIFO) — it produces the ring-by-ring order, so nearer nodes finish first." },
            { front: "Time complexity of BFS on V nodes, E edges?", back: "O(V + E) — each node enqueued once, each edge examined once." },
          ],
        },
      ],
    },
  ],
};

export const tracks: TrackMeta[] = [foundationsTrack];

export function getTrack(slug: string): TrackMeta | undefined {
  return tracks.find((t) => t.slug === slug);
}

/** All lessons of a track in reading order (module position, then lesson position). */
export function flattenLessons(track: TrackMeta): LessonMeta[] {
  return [...track.modules]
    .sort((a, b) => a.position - b.position)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.position - b.position));
}

export interface LessonLocation {
  track: TrackMeta;
  module: { slug: string; title: string };
  lesson: LessonMeta;
  /** The next lesson in reading order, or null at the end of the track. */
  next: LessonMeta | null;
}

export function locateLesson(trackSlug: string, lessonSlug: string): LessonLocation | undefined {
  const track = getTrack(trackSlug);
  if (!track) return undefined;
  for (const module of track.modules) {
    const lesson = module.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) {
      const ordered = flattenLessons(track);
      const idx = ordered.findIndex((l) => l.slug === lessonSlug);
      return {
        track,
        module: { slug: module.slug, title: module.title },
        lesson,
        next: ordered[idx + 1] ?? null,
      };
    }
  }
  return undefined;
}
