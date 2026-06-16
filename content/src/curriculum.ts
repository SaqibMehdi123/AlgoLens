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
          slug: "linear-search",
          title: "Linear Search",
          summary:
            "The no-assumptions baseline: scan until you hit it. Know what binary search beats, and when O(n) is genuinely optimal.",
          file: "linear-search.mdx",
          estMinutes: 8,
          difficulty: "intro",
          position: 1,
          quizCount: 2,
          prerequisites: ["big-o-notation"],
          practiceSlug: "find-index",
          reviewCards: [
            { front: "When is linear search the right choice?", back: "Unsorted data scanned **once** — no preprocessing, O(n) is optimal." },
            { front: "Cost of Q queries on the same unsorted array via linear search?", back: "O(Q · n). Repeated queries → preprocess (sort + binary search, or a hash set)." },
          ],
        },
        {
          slug: "binary-search",
          title: "Binary Search",
          summary:
            "Halve the search space every step: the algorithm that turns a million-element scan into twenty comparisons.",
          file: "binary-search.mdx",
          estMinutes: 12,
          difficulty: "intro",
          position: 2,
          quizCount: 2,
          prerequisites: ["big-o-notation", "linear-search"],
          practiceSlug: "binary-search-position",
          reviewCards: [
            { front: "Time complexity of binary search?", back: "O(log n) — each comparison halves the search window." },
            { front: "What precondition does binary search require?", back: "A **sorted** array. On unsorted data it fails silently." },
          ],
        },
      ],
    },
    {
      slug: "sorting",
      title: "Sorting",
      position: 3,
      lessons: [
        {
          slug: "selection-sort",
          title: "Selection Sort",
          summary:
            "Repeatedly select the minimum and place it — the clearest view of the sorted/unsorted boundary, and the fewest writes of any O(n²) sort.",
          file: "selection-sort.mdx",
          estMinutes: 9,
          difficulty: "easy",
          position: 1,
          quizCount: 2,
          prerequisites: ["big-o-notation"],
          practiceSlug: "second-largest",
          reviewCards: [
            { front: "Best-case time of selection sort?", back: "Still **O(n²)** — no early exit; it scans the whole suffix every pass." },
            { front: "How many swaps does selection sort make?", back: "At most n − 1 (one per pass) — the fewest writes of any O(n²) sort." },
          ],
        },
        {
          slug: "insertion-sort",
          title: "Insertion Sort",
          summary:
            "Slide each element into a growing sorted prefix. Stable, online, and O(n) on nearly-sorted data — the sort hybrids fall back to.",
          file: "insertion-sort.mdx",
          estMinutes: 10,
          difficulty: "easy",
          position: 2,
          quizCount: 2,
          prerequisites: ["big-o-notation", "selection-sort"],
          practiceSlug: "sort-colors",
          reviewCards: [
            { front: "Best-case time of insertion sort, and when?", back: "O(n) on already/nearly-sorted input — the inner loop barely runs. It's **adaptive**." },
            { front: "Is insertion sort stable?", back: "Yes — it swaps only strict inversions (>, never ≥), preserving equal-key order." },
          ],
        },
        {
          slug: "merge-sort",
          title: "Merge Sort",
          summary:
            "Divide and conquer: split to single elements, merge sorted halves. A guaranteed O(n log n), stable, and the canonical linked-list sort.",
          file: "merge-sort.mdx",
          estMinutes: 12,
          difficulty: "easy",
          position: 3,
          quizCount: 2,
          prerequisites: ["big-o-notation", "insertion-sort"],
          practiceSlug: "merge-two-sorted",
          reviewCards: [
            { front: "Worst-case time of merge sort?", back: "O(n log n) — guaranteed for any input (balanced positional split)." },
            { front: "Merge sort: in place? stable?", back: "Not in place (O(n) scratch); stable when ties break toward the left half." },
          ],
        },
        {
          slug: "quick-sort",
          title: "Quick Sort",
          summary:
            "Partition around a pivot — fast and in place in practice, O(n²) on bad pivots. The basis of quickselect and the world's default sort.",
          file: "quick-sort.mdx",
          estMinutes: 13,
          difficulty: "medium",
          position: 4,
          quizCount: 2,
          prerequisites: ["big-o-notation", "merge-sort"],
          practiceSlug: "kth-largest",
          reviewCards: [
            { front: "Quicksort worst case, and its trigger?", back: "O(n²) when pivots are always min/max (e.g., sorted input + last-element pivot). Randomize the pivot." },
            { front: "What does one partition guarantee?", back: "The pivot reaches its **final** sorted position; smaller left, larger right (sides not yet sorted)." },
          ],
        },
      ],
    },
    {
      slug: "graphs-intro",
      title: "Graph Traversal",
      position: 4,
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
        {
          slug: "depth-first-search",
          title: "Depth-First Search",
          summary:
            "Dive deep and backtrack with a stack — the engine behind cycle detection, topological sort, and connected components.",
          file: "depth-first-search.mdx",
          estMinutes: 12,
          difficulty: "easy",
          position: 2,
          quizCount: 2,
          prerequisites: ["big-o-notation", "breadth-first-search"],
          practiceSlug: null,
          reviewCards: [
            { front: "Which structure drives DFS, and what does it give you?", back: "A **stack** (often recursion). The active stack = the current root→node path." },
            { front: "Can DFS find shortest paths in an unweighted graph?", back: "No — use **BFS** for that. DFS is for cycles, topo-sort, components, reachability." },
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
