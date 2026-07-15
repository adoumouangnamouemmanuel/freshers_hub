ALTER TABLE "sessions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
UPDATE "sessions" SET "status" = 'scheduled' WHERE "status" = 'booked';--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "status" SET DEFAULT 'scheduled'::text;--> statement-breakpoint
DROP TYPE "public"."session_status";--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show');--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"public"."session_status";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "status" SET DATA TYPE "public"."session_status" USING "status"::"public"."session_status";