CREATE TYPE "public"."announcement_audience" AS ENUM('school_wide', 'coaching_unit');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"target_audience" "announcement_audience" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_year_id" integer NOT NULL,
	"fresher_id" uuid NOT NULL,
	"followed_up_by" uuid NOT NULL,
	"notes" text,
	"followed_up_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_reports" ADD COLUMN "needs_follow_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session_reports" ADD COLUMN "followed_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_follow_ups" ADD CONSTRAINT "compliance_follow_ups_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_follow_ups" ADD CONSTRAINT "compliance_follow_ups_fresher_id_users_id_fk" FOREIGN KEY ("fresher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_follow_ups" ADD CONSTRAINT "compliance_follow_ups_followed_up_by_users_id_fk" FOREIGN KEY ("followed_up_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;