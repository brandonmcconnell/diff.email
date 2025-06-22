-- 1. Add columns nullable first
alter table "user" add column "first_name" text;
alter table "user" add column "last_name" text;

-- 2. Populate from existing name (split on first space; fallback both to name)
update "user"
set first_name = split_part(name, ' ', 1),
    last_name  = coalesce(nullif(split_part(name, ' ', 2), ''), split_part(name, ' ', 1));

-- 3. Make columns NOT NULL now that data exists
-- Pre-emptively drop not null in case column exists from a failed migration
alter table "user" alter column "first_name" drop not null;
alter table "user" alter column "last_name" drop not null;

-- Ensure no remaining nulls
-- update "user" set first_name = '' where first_name is null;
-- update "user" set last_name = '' where last_name is null; 