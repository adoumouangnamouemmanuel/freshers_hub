ALTER TABLE "counsellor_assignments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "counsellor_assignments" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "counsellor_assignments" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp with time zone;