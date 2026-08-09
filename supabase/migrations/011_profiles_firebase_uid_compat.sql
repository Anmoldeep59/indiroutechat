-- Align legacy profiles table with IndiRoute auth expectations.
-- Keeps existing rows; adds missing columns used by /api/profiles/sync and auth-server.

alter table public.profiles
  add column if not exists firebase_uid text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill names from full_name when present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    update public.profiles
    set
      first_name = coalesce(first_name, nullif(split_part(full_name, ' ', 1), '')),
      last_name = coalesce(
        last_name,
        nullif(regexp_replace(full_name, '^\S+\s*', ''), '')
      )
    where full_name is not null;
  end if;
end $$;

create unique index if not exists profiles_firebase_uid_uidx
  on public.profiles (firebase_uid)
  where firebase_uid is not null;
