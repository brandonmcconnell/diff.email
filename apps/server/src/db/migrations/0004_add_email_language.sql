-- Add email_language enum and language column
DO $$ BEGIN
    CREATE TYPE email_language AS ENUM ('html', 'jsx');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE emails
    ADD COLUMN IF NOT EXISTS language email_language NOT NULL DEFAULT 'html'; 