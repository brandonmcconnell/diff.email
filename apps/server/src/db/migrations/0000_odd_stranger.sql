CREATE TABLE "browser_contexts" (
	"id" text PRIMARY KEY NOT NULL,
	"client" "client" NOT NULL,
	"engine" "engine" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
