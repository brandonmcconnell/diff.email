ALTER TABLE "versions" ALTER COLUMN "html" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "versions" ADD COLUMN "files" jsonb;