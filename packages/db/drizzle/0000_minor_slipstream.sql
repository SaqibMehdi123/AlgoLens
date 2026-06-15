CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "citext";--> statement-breakpoint
CREATE TYPE "public"."code_language" AS ENUM('javascript', 'typescript', 'python');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('intro', 'easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('lesson', 'problem', 'visualization', 'analysis');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."quiz_type" AS ENUM('single_choice', 'multi_select', 'predict_output', 'complexity_pick');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('learner', 'author', 'admin');--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	CONSTRAINT "auth_accounts_provider_provider_account_id_unique" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"criteria" jsonb NOT NULL,
	CONSTRAINT "badges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "complexity_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"code_hash" text NOT NULL,
	"language" "code_language" NOT NULL,
	"source_code" text NOT NULL,
	"generator_key" text,
	"static_result" jsonb,
	"empirical_result" jsonb,
	"ai_result" jsonb,
	"final_estimate" text,
	"confidence" text DEFAULT 'low' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_prerequisites" (
	"lesson_id" uuid NOT NULL,
	"prerequisite_id" uuid NOT NULL,
	CONSTRAINT "lesson_prerequisites_lesson_id_prerequisite_id_pk" PRIMARY KEY("lesson_id","prerequisite_id"),
	CONSTRAINT "no_self_prereq" CHECK ("lesson_prerequisites"."lesson_id" <> "lesson_prerequisites"."prerequisite_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_tags" (
	"lesson_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "lesson_tags_lesson_id_tag_id_pk" PRIMARY KEY("lesson_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content_path" text NOT NULL,
	"est_minutes" integer DEFAULT 10 NOT NULL,
	"difficulty" "difficulty" DEFAULT 'intro' NOT NULL,
	"position" integer NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_slug_unique" UNIQUE("slug"),
	CONSTRAINT "lessons_module_id_position_unique" UNIQUE("module_id","position")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "modules_track_id_slug_unique" UNIQUE("track_id","slug"),
	CONSTRAINT "modules_track_id_position_unique" UNIQUE("track_id","position")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"response" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"qtype" "quiz_type" NOT NULL,
	"prompt_mdx" text NOT NULL,
	"options" jsonb NOT NULL,
	"answer" jsonb NOT NULL,
	"explanation_mdx" text,
	CONSTRAINT "quiz_questions_lesson_id_position_unique" UNIQUE("lesson_id","position")
);
--> statement-breakpoint
CREATE TABLE "review_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_kind" "entity_kind" NOT NULL,
	"source_id" uuid NOT NULL,
	"front_mdx" text NOT NULL,
	"back_mdx" text NOT NULL,
	"ease_factor" numeric(4, 2) DEFAULT '2.50' NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_cards_user_id_source_kind_source_id_front_mdx_unique" UNIQUE("user_id","source_kind","source_id","front_mdx")
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"grade" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"interval_after" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"level" "difficulty" DEFAULT 'intro' NOT NULL,
	"position" integer NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	CONSTRAINT "tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "user_lesson_progress" (
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'not_started' NOT NULL,
	"scroll_pct" smallint DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_lesson_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id"),
	CONSTRAINT "scroll_pct_range" CHECK ("user_lesson_progress"."scroll_pct" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	"preferred_lang" "code_language" DEFAULT 'javascript' NOT NULL,
	"daily_goal_xp" integer DEFAULT 50 NOT NULL,
	"email_digest" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"xp_total" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"streak_freezes" integer DEFAULT 1 NOT NULL,
	"last_active_on" date
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"username" "citext" NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'learner' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "visualizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"algo_key" text NOT NULL,
	"description_mdx" text,
	"pseudocode" jsonb NOT NULL,
	"complexity" jsonb NOT NULL,
	"default_config" jsonb NOT NULL,
	"max_input_size" integer DEFAULT 200 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "visualizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "viz_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"share_slug" text NOT NULL,
	"user_id" uuid,
	"visualization_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"frame_index" integer DEFAULT 0 NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "viz_snapshots_share_slug_unique" UNIQUE("share_slug")
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_kind" "entity_kind",
	"ref_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complexity_analyses" ADD CONSTRAINT "complexity_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_prerequisites" ADD CONSTRAINT "lesson_prerequisites_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_prerequisites" ADD CONSTRAINT "lesson_prerequisites_prerequisite_id_lessons_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_card_id_review_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."review_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viz_snapshots" ADD CONSTRAINT "viz_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viz_snapshots" ADD CONSTRAINT "viz_snapshots_visualization_id_visualizations_id_fk" FOREIGN KEY ("visualization_id") REFERENCES "public"."visualizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analyses_user_idx" ON "complexity_analyses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "analyses_code_hash_idx" ON "complexity_analyses" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_q_idx" ON "quiz_attempts" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE INDEX "review_cards_due_idx" ON "review_cards" USING btree ("user_id","due_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_user_status_idx" ON "user_lesson_progress" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "viz_snapshots_user_idx" ON "viz_snapshots" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "xp_events_user_idx" ON "xp_events" USING btree ("user_id","created_at");