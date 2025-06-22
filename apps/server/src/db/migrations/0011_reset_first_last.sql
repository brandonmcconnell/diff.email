-- Emergency migration to reset first_name/last_name columns cleanly in dev

-- 1) Drop existing columns (if they exist at any type/constraint state)
alter table "user" drop column if exists "first_name";
alter table "user" drop column if exists "last_name";

-- 2) Recreate columns nullable (can add NOT NULL later)
alter table "user" add column "first_name" text;
alter table "user" add column "last_name"  text;

-- 3) Populate from name
update "user"
set first_name = split_part(name,' ',1),
    last_name  = coalesce(nullif(split_part(name,' ',2),''), split_part(name,' ',1)); 