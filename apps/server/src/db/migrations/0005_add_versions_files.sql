-- Make html nullable and add files column to store JSX virtual filesystem
ALTER TABLE versions
    ALTER COLUMN html DROP NOT NULL;

ALTER TABLE versions
    ADD COLUMN IF NOT EXISTS files jsonb; 