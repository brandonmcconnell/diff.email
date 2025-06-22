-- Adds first_name and last_name with safe defaults, then back-fills from existing name column

-- 1) Add columns with default so no existing row violates NOT NULL
alter table "user" add column if not exists "first_name" text default '';
alter table "user" add column if not exists "last_name"  text default '';

-- 2) Populate using the legacy `name` column. If no space present, duplicate to last_name.
update "user"
set first_name = split_part(name, ' ', 1),
    last_name  = coalesce(nullif(split_part(name, ' ', 2), ''), split_part(name, ' ', 1));

-- 3) (Optional) enforce NOT NULL and/or drop default later 