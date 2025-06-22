-- Fix existing nulls in first_name / last_name columns if a previous failed migration left them NOT NULL with null values

-- 1. Temporarily allow NULLs
alter table "user" alter column "first_name" drop not null;
alter table "user" alter column "last_name" drop not null;

-- 2. Fill nulls from `name` (again)
update "user"
set first_name = coalesce(first_name, split_part(name,' ',1)),
    last_name  = coalesce(last_name,  coalesce(nullif(split_part(name,' ',2),''), split_part(name,' ',1)) );

-- 3. Reinstate NOT NULL (optional; comment out if you want nullable)
alter table "user" alter column "first_name" set not null;
alter table "user" alter column "last_name" set not null; 