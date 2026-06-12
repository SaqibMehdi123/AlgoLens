/**
 * Badges with a machine-evaluable criteria rule (docs/03 §7). The evaluator is pure: feed it a
 * stats snapshot, get back the set of earned badge slugs. Criteria are data, so new badges are
 * added without new code (they become rows when the DB lands).
 */
export type BadgeCriteria =
  | { kind: "lessons_completed"; count: number }
  | { kind: "problems_solved"; count: number; tag?: string }
  | { kind: "streak"; count: number }
  | { kind: "reviews_completed"; count: number }
  | { kind: "level"; value: number };

export interface BadgeDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
}

export interface StatsSnapshot {
  lessonsCompleted: number;
  problemsSolved: number;
  problemsSolvedByTag: Record<string, number>;
  reviewsCompleted: number;
  currentStreak: number;
  level: number;
}

export const BADGES: BadgeDef[] = [
  { slug: "first-lesson", name: "First Light", description: "Complete your first lesson", icon: "📘", criteria: { kind: "lessons_completed", count: 1 } },
  { slug: "scholar", name: "Scholar", description: "Complete 3 lessons", icon: "🎓", criteria: { kind: "lessons_completed", count: 3 } },
  { slug: "first-solve", name: "First Blood", description: "Solve your first problem", icon: "⚡", criteria: { kind: "problems_solved", count: 1 } },
  { slug: "solver-10", name: "Problem Solver", description: "Solve 10 problems", icon: "🧩", criteria: { kind: "problems_solved", count: 10 } },
  { slug: "graph-master", name: "Graph Master", description: "Solve 5 graph problems", icon: "🕸️", criteria: { kind: "problems_solved", count: 5, tag: "graphs" } },
  { slug: "streak-7", name: "On a Roll", description: "Reach a 7-day streak", icon: "🔥", criteria: { kind: "streak", count: 7 } },
  { slug: "streak-30", name: "Unstoppable", description: "Reach a 30-day streak", icon: "🌟", criteria: { kind: "streak", count: 30 } },
  { slug: "reviewer-25", name: "Memory Athlete", description: "Complete 25 reviews", icon: "🧠", criteria: { kind: "reviews_completed", count: 25 } },
  { slug: "level-5", name: "Rising Star", description: "Reach level 5", icon: "✨", criteria: { kind: "level", value: 5 } },
];

export function meetsCriteria(criteria: BadgeCriteria, stats: StatsSnapshot): boolean {
  switch (criteria.kind) {
    case "lessons_completed":
      return stats.lessonsCompleted >= criteria.count;
    case "problems_solved":
      return criteria.tag
        ? (stats.problemsSolvedByTag[criteria.tag] ?? 0) >= criteria.count
        : stats.problemsSolved >= criteria.count;
    case "streak":
      return stats.currentStreak >= criteria.count;
    case "reviews_completed":
      return stats.reviewsCompleted >= criteria.count;
    case "level":
      return stats.level >= criteria.value;
  }
}

/** Slugs of every badge the stats currently satisfy. */
export function evaluateBadges(stats: StatsSnapshot): string[] {
  return BADGES.filter((b) => meetsCriteria(b.criteria, stats)).map((b) => b.slug);
}
