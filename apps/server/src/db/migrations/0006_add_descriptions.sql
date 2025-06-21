-- Add optional description columns to projects and emails
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE emails
    ADD COLUMN IF NOT EXISTS description text; 