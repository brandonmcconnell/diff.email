ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "description" text;