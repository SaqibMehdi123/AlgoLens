/**
 * Curriculum manifest types — the content-in-repo mirror of docs/03 §2 (tracks → modules →
 * lessons). Metadata lives here; lesson bodies are MDX files in content/lessons/. When the DB
 * becomes authoritative (Phase 2 server-side), this manifest becomes the seed source, exactly
 * like the visualization registry seeds the visualizations table.
 */
export type Difficulty = "intro" | "easy" | "medium" | "hard";

export interface LessonMeta {
  slug: string;
  title: string;
  summary: string;
  /** MDX file name inside content/lessons/. */
  file: string;
  estMinutes: number;
  difficulty: Difficulty;
  position: number;
  /**
   * Number of <Quiz/> blocks in the MDX — completion requires passing all of them plus reading
   * to the end. Asserted against the file contents by content tests, so it cannot drift.
   */
  quizCount: number;
  /** Lesson slugs that should be completed first (docs/03 lesson_prerequisites). */
  prerequisites: string[];
  /** Linked practice problem slug (Phase 4); null until the problem exists. */
  practiceSlug: string | null;
  /** Key facts turned into SM-2 review cards on lesson completion (docs/03 §6). */
  reviewCards: { front: string; back: string }[];
}

export interface ModuleMeta {
  slug: string;
  title: string;
  position: number;
  lessons: LessonMeta[];
}

export interface TrackMeta {
  slug: string;
  title: string;
  description: string;
  level: Difficulty;
  position: number;
  modules: ModuleMeta[];
}
