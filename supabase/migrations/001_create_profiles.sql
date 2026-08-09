-- IndiRoute: profiles table
-- Authentication remains in Firebase; this table stores app profile data keyed by firebase_uid.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  country text,
  avatar_url text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_firebase_uid_unique unique (firebase_uid),
  constraint profiles_role_check check (role in ('customer', 'admin'))
);

create index if not exists profiles_firebase_uid_idx
  on public.profiles (firebase_uid);

create index if not exists profiles_email_idx
  on public.profiles (email);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();
