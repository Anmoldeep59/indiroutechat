-- Minimal Aramex pricing bootstrap for an existing non-IndiRoute schema.
-- Safe: does not drop shipping_quotes / profiles / lockers.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.shipping_settings (
  id integer primary key check (id = 1),
  shipping_markup_percent numeric(6, 3) not null default 0,
  handling_fee_inr numeric(12, 2) not null default 0,
  service_fee_inr numeric(12, 2) not null default 0,
  gst_rate numeric(6, 4) not null default 0,
  volumetric_divisor numeric(12, 2) not null default 5000,
  tax_mode text not null default 'gst_none',
  economy_enabled boolean not null default true,
  standard_enabled boolean not null default true,
  express_enabled boolean not null default false,
  final_price_round_to_inr numeric(12, 2) not null default 10,
  currency text not null default 'INR',
  quote_validity_hours integer not null default 24,
  aramex_fuel_surcharge_percent numeric(8, 4) not null default 23.25,
  base_rate_source text not null default 'admin_table',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipping_settings
  add column if not exists quote_validity_hours integer not null default 24,
  add column if not exists aramex_fuel_surcharge_percent numeric(8, 4) not null default 23.25,
  add column if not exists base_rate_source text not null default 'admin_table';

insert into public.shipping_settings (id)
values (1)
on conflict (id) do update set
  volumetric_divisor = 5000,
  aramex_fuel_surcharge_percent = coalesce(public.shipping_settings.aramex_fuel_surcharge_percent, 23.25),
  base_rate_source = coalesce(public.shipping_settings.base_rate_source, 'admin_table'),
  tax_mode = 'gst_none';

create table if not exists public.shipping_countries (
  country_code text primary key,
  country_name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.shipping_countries (country_code, country_name, enabled) values
  ('AU', 'Australia', true),
  ('US', 'United States', true),
  ('GB', 'United Kingdom', true),
  ('CA', 'Canada', true),
  ('NZ', 'New Zealand', true),
  ('AE', 'United Arab Emirates', true),
  ('DE', 'Germany', true),
  ('MY', 'Malaysia', true),
  ('IT', 'Italy', true),
  ('FR', 'France', true),
  ('JP', 'Japan', true),
  ('CH', 'Switzerland', true),
  ('SG', 'Singapore', true),
  ('SA', 'Saudi Arabia', true)
on conflict (country_code) do update set
  country_name = excluded.country_name,
  enabled = true;

create table if not exists public.shipping_service_mappings (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  customer_tier text not null,
  source_service_id integer not null,
  source_service_name text not null,
  source_sla text not null,
  role text not null default 'candidate',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_margin_brackets (
  id uuid primary key default gen_random_uuid(),
  min_amount_inr numeric(12, 2) not null,
  max_amount_inr numeric(12, 2),
  margin_percent numeric(8, 4) not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

delete from public.shipping_margin_brackets;
insert into public.shipping_margin_brackets (
  min_amount_inr, max_amount_inr, margin_percent, sort_order, active
) values
  (0, 1000, 12, 1, true),
  (1001, 2500, 10, 2, true),
  (2501, 5000, 8, 3, true),
  (5000.01, null, 6, 4, true);

create table if not exists public.shipping_handling_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

delete from public.shipping_handling_fee_slabs;
insert into public.shipping_handling_fee_slabs (min_kg, max_kg, fee_inr, active) values
  (0, 0.5, 49, true),
  (0.5, 1, 69, true),
  (1, 2, 89, true),
  (2, 5, 129, true),
  (5, 10, 199, true),
  (10, 20, 299, true),
  (20, 30, 399, true);

create table if not exists public.shipping_service_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

delete from public.shipping_service_fee_slabs;
insert into public.shipping_service_fee_slabs (min_kg, max_kg, fee_inr, active) values
  (0, 0.5, 79, true),
  (0.5, 1, 99, true),
  (1, 2, 129, true),
  (2, 5, 179, true),
  (5, 10, 249, true),
  (10, 20, 349, true),
  (20, 30, 499, true);

create table if not exists public.shipping_repacking_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

delete from public.shipping_repacking_fee_slabs;
insert into public.shipping_repacking_fee_slabs (min_kg, max_kg, fee_inr, active) values
  (0, 0.5, 49, true),
  (0.5, 1, 69, true),
  (1, 2, 99, true),
  (2, 5, 149, true),
  (5, 10, 249, true),
  (10, 20, 399, true),
  (20, 30, 599, true);

create table if not exists public.shipping_packing_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

delete from public.shipping_packing_fee_slabs;
insert into public.shipping_packing_fee_slabs (min_kg, max_kg, fee_inr, active)
select min_kg, max_kg, fee_inr, active from public.shipping_repacking_fee_slabs;

create table if not exists public.aramex_base_rates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  service_tier text not null,
  min_weight_kg numeric(10, 3) not null,
  max_weight_kg numeric(10, 3),
  base_aramex_rate numeric(12, 2) not null,
  currency text not null default 'INR',
  source_sla text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint aramex_base_rates_tier_check check (
    service_tier in ('economy', 'standard')
  )
);

create index if not exists aramex_base_rates_lookup_idx
  on public.aramex_base_rates (country_code, service_tier, active, min_weight_kg);
