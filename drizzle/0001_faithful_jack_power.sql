CREATE TYPE "public"."habit_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."journey_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "habit_schedule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"schedule_days" smallint[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"journey_id" uuid NOT NULL,
	"title" varchar(80) NOT NULL,
	"emoji" varchar(16),
	"status" "habit_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"archived_on" date
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "journey_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"goal" varchar(120),
	"focus_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habit_schedule_versions" ADD CONSTRAINT "habit_schedule_versions_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_schedule_versions_habit_effective_idx" ON "habit_schedule_versions" USING btree ("habit_id","effective_from");--> statement-breakpoint
CREATE INDEX "habits_user_status_idx" ON "habits" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "habits_journey_id_idx" ON "habits" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "journeys_user_id_idx" ON "journeys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "journeys_one_active_per_user_idx" ON "journeys" USING btree ("user_id") WHERE "journeys"."status" = 'active';