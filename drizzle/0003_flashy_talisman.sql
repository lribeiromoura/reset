CREATE TABLE "daily_reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"local_date" date NOT NULL,
	"mood" smallint NOT NULL,
	"text" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_reflections_mood_range_check" CHECK ("daily_reflections"."mood" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "daily_reflections" ADD CONSTRAINT "daily_reflections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_reflections_user_local_date_idx" ON "daily_reflections" USING btree ("user_id","local_date");