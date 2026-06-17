/**
 * AlgoLens database schema — Drizzle translation of docs/03-backend-schema.md.
 *
 * Conventions kept 1:1 with the doc: UUID PKs (gen_random_uuid), snake_case, timestamptz,
 * PG enums, FKs indexed, soft-delete only where history matters.
 *
 * This file covers the identity, curriculum, and visualize domains (Phases 0–2). The practice,
 * review, gamification, and community domains (docs/03 §5–§8) are added in their respective phase
 * migrations — see docs/STATUS.md.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** Case-insensitive text (Postgres `citext`); used for email + username uniqueness. */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

// --- 0. Enums -----------------------------------------------------------------------------------

export const userRole = pgEnum("user_role", ["learner", "author", "admin"]);
export const contentStatus = pgEnum("content_status", ["draft", "review", "published", "archived"]);
export const difficulty = pgEnum("difficulty", ["intro", "easy", "medium", "hard"]);
export const progressStatus = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);
export const quizType = pgEnum("quiz_type", [
  "single_choice",
  "multi_select",
  "predict_output",
  "complexity_pick",
]);
export const codeLanguage = pgEnum("code_language", ["javascript", "typescript", "python"]);
export const entityKind = pgEnum("entity_kind", ["lesson", "problem", "visualization", "analysis"]);

// --- 1. Identity & accounts ---------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: citext("email").notNull().unique(),
  username: citext("username").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  // bcrypt hash for email/password sign-in. NULL for OAuth-only accounts (they have no password).
  passwordHash: text("password_hash"),
  role: userRole("role").notNull().default("learner"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'google' | 'github' | 'email'
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.provider, t.providerAccountId),
    index("auth_accounts_user_id_idx").on(t.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("dark"),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  preferredLang: codeLanguage("preferred_lang").notNull().default("javascript"),
  dailyGoalXp: integer("daily_goal_xp").notNull().default(50),
  emailDigest: boolean("email_digest").notNull().default(true),
});

// --- 2. Learn — curriculum & progress -----------------------------------------------------------

export const tracks = pgTable("tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  level: difficulty("level").notNull().default("intro"),
  position: integer("position").notNull(),
  status: contentStatus("status").notNull().default("draft"),
});

export const modules = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [unique().on(t.trackId, t.slug), unique().on(t.trackId, t.position)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary"),
    contentPath: text("content_path").notNull(),
    estMinutes: integer("est_minutes").notNull().default(10),
    difficulty: difficulty("difficulty").notNull().default("intro"),
    position: integer("position").notNull(),
    status: contentStatus("status").notNull().default("draft"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.moduleId, t.position)],
);

export const lessonPrerequisites = pgTable(
  "lesson_prerequisites",
  {
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    prerequisiteId: uuid("prerequisite_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.lessonId, t.prerequisiteId] }),
    check("no_self_prereq", sql`${t.lessonId} <> ${t.prerequisiteId}`),
  ],
);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const lessonTags = pgTable(
  "lesson_tags",
  {
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.lessonId, t.tagId] })],
);

export const userLessonProgress = pgTable(
  "user_lesson_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    status: progressStatus("status").notNull().default("not_started"),
    scrollPct: smallint("scroll_pct").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.lessonId] }),
    index("progress_user_status_idx").on(t.userId, t.status),
    check("scroll_pct_range", sql`${t.scrollPct} between 0 and 100`),
  ],
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    qtype: quizType("qtype").notNull(),
    promptMdx: text("prompt_mdx").notNull(),
    options: jsonb("options").notNull(),
    answer: jsonb("answer").notNull(),
    explanationMdx: text("explanation_mdx"),
  },
  (t) => [unique().on(t.lessonId, t.position)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    response: jsonb("response").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    attemptedAt: createdAt(),
  },
  (t) => [index("quiz_attempts_user_q_idx").on(t.userId, t.questionId)],
);

// --- 3. Visualize — catalog & shareable snapshots -----------------------------------------------

export interface ComplexityJson {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export const visualizations = pgTable("visualizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  algoKey: text("algo_key").notNull(),
  descriptionMdx: text("description_mdx"),
  pseudocode: jsonb("pseudocode").$type<string[]>().notNull(),
  complexity: jsonb("complexity").$type<ComplexityJson>().notNull(),
  defaultConfig: jsonb("default_config").notNull(),
  maxInputSize: integer("max_input_size").notNull().default(200),
  status: contentStatus("status").notNull().default("draft"),
  position: integer("position").notNull().default(0),
});

export const vizSnapshots = pgTable(
  "viz_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shareSlug: text("share_slug").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    visualizationId: uuid("visualization_id")
      .notNull()
      .references(() => visualizations.id, { onDelete: "cascade" }),
    config: jsonb("config").notNull(),
    frameIndex: integer("frame_index").notNull().default(0),
    title: text("title"),
    createdAt: createdAt(),
  },
  (t) => [index("viz_snapshots_user_idx").on(t.userId, t.createdAt)],
);

// --- 4. Analyze — Complexity Lab (docs/03 §4) ----------------------------------------------------

export const complexityAnalyses = pgTable(
  "complexity_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // anonymous allowed
    codeHash: text("code_hash").notNull(), // sha256(language||source) → dedupe & AI cache
    language: codeLanguage("language").notNull(),
    sourceCode: text("source_code").notNull(),
    generatorKey: text("generator_key"),
    staticResult: jsonb("static_result"),
    empiricalResult: jsonb("empirical_result"),
    aiResult: jsonb("ai_result"),
    finalEstimate: text("final_estimate"),
    confidence: text("confidence").notNull().default("low"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("analyses_user_idx").on(t.userId, t.createdAt),
    index("analyses_code_hash_idx").on(t.codeHash),
  ],
);

// --- 6. Review — spaced repetition (SM-2, docs/03 §6) -------------------------------------------

export const reviewCards = pgTable(
  "review_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceKind: entityKind("source_kind").notNull(),
    sourceId: uuid("source_id").notNull(),
    frontMdx: text("front_mdx").notNull(),
    backMdx: text("back_mdx").notNull(),
    easeFactor: numeric("ease_factor", { precision: 4, scale: 2 }).notNull().default("2.50"),
    intervalDays: integer("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).defaultNow().notNull(),
    suspended: boolean("suspended").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    unique().on(t.userId, t.sourceKind, t.sourceId, t.frontMdx),
    index("review_cards_due_idx").on(t.userId, t.dueAt),
  ],
);

export const reviewLogs = pgTable("review_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => reviewCards.id, { onDelete: "cascade" }),
  grade: smallint("grade").notNull(),
  reviewedAt: createdAt(),
  intervalAfter: integer("interval_after").notNull(),
});

// --- 7. Gamification & activity (docs/03 §7) ----------------------------------------------------

export const userStats = pgTable("user_stats", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  xpTotal: integer("xp_total").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  streakFreezes: integer("streak_freezes").notNull().default(1),
  lastActiveOn: date("last_active_on"),
});

export const xpEvents = pgTable(
  "xp_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    refKind: entityKind("ref_kind"),
    refId: uuid("ref_id"),
    createdAt: createdAt(),
  },
  (t) => [index("xp_events_user_idx").on(t.userId, t.createdAt)],
);

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  criteria: jsonb("criteria").notNull(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ReviewCard = typeof reviewCards.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type Visualization = typeof visualizations.$inferSelect;
export type NewVisualization = typeof visualizations.$inferInsert;
export type ComplexityAnalysis = typeof complexityAnalyses.$inferSelect;
