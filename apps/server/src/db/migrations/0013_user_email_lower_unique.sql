-- Ensure user.email is unique case-insensitively
-- (fails to create if duplicate lowercased emails already exist)
CREATE UNIQUE INDEX IF NOT EXISTS user_email_lower_unique ON "user" (lower(email)); 