-- Safe sequential locker codes: IR-100001, IR-100002, ...
-- Idempotent assignment: one locker per profile (profile_id is already unique).

create sequence if not exists public.locker_code_seq
  as bigint
  start with 100001
  increment by 1
  minvalue 100001
  no maxvalue
  cache 1;

create or replace function public.allocate_locker_code()
returns text
language plpgsql
as $$
declare
  next_num bigint;
begin
  next_num := nextval('public.locker_code_seq');
  return 'IR-' || next_num::text;
end;
$$;

create or replace function public.ensure_customer_locker(
  p_profile_id uuid,
  p_warehouse_name text default 'IndiRoute Warehouse',
  p_line1 text default null,
  p_line2 text default null,
  p_city text default 'New Delhi',
  p_state text default null,
  p_postal_code text default null,
  p_country text default 'India'
)
returns public.lockers
language plpgsql
as $$
declare
  existing public.lockers;
  created public.lockers;
begin
  select *
  into existing
  from public.lockers
  where profile_id = p_profile_id;

  if found then
    return existing;
  end if;

  begin
    insert into public.lockers (
      profile_id,
      locker_code,
      warehouse_name,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
      status,
      storage_started_at
    )
    values (
      p_profile_id,
      public.allocate_locker_code(),
      coalesce(nullif(trim(p_warehouse_name), ''), 'IndiRoute Warehouse'),
      nullif(trim(p_line1), ''),
      nullif(trim(p_line2), ''),
      coalesce(nullif(trim(p_city), ''), 'New Delhi'),
      nullif(trim(p_state), ''),
      nullif(trim(p_postal_code), ''),
      coalesce(nullif(trim(p_country), ''), 'India'),
      'active',
      now()
    )
    returning * into created;

    return created;
  exception
    when unique_violation then
      select *
      into existing
      from public.lockers
      where profile_id = p_profile_id;

      if found then
        return existing;
      end if;

      raise;
  end;
end;
$$;
