CREATE TYPE "public"."email_language" AS ENUM('html', 'jsx');--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "language" "email_language" DEFAULT 'html' NOT NULL;