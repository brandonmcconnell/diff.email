-- Re-create user table if it was manually dropped in dev
create table if not exists "user" (
  "id" text primary key,
  "first_name" text,
  "last_name" text,
  "name" text not null,
  "email" text not null unique,
  "email_verified" boolean not null default false,
  "image" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
); 