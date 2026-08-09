import fs from "node:fs";
import path from "node:path";

const outPath = path.join(
  "supabase",
  "migrations",
  "006_shipping_calculator.sql",
);
const mappings = fs.readFileSync(
  path.join("supabase", "migrations", "_seed_mappings_fragment.sql"),
  "utf8",
);
const rates = fs.readFileSync(
  path.join("supabase", "migrations", "_seed_rates_fragment.sql"),
  "utf8",
);

const sql = `-- IndiRoute production shipping calculator schema
-- Replaces placeholder shipping_rates with ratecard-backed rows.
-- Source courier names/IDs are admin/audit only — never expose to customers.

-- ---------------------------------------------------------------------------
-- Drop legacy public rate exposure (source costs must stay server-side)
-- ---------------------------------------------------------------------------
drop policy if exists "Allow public read of active shipping rates" on public.shipping_rates;

-- ---------------------------------------------------------------------------
-- Rebuild shipping_rates for ratecard rows
-- ---------------------------------------------------------------------------
drop table if exists public.shipping_rates cascade;

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  weight_kg numeric(10, 3) not null,
  source_service_name text not null,
  source_service_id integer not null,
  source_sla text,
  lite_rate numeric(12, 2),
  basic_rate numeric(12, 2),
  advanced_rate numeric(12, 2),
  pro_rate numeric(12, 2),
  enterprise_rate numeric(12, 2),
  diamond_rate numeric(12, 2),
  safe_source_rate numeric(12, 2) not null,
  customer_service_tier text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_rates_tier_check check (
    customer_service_tier is null
    or customer_service_tier in ('economy', 'standard')
  ),
  constraint shipping_rates_weight_positive check (weight_kg > 0),
  constraint shipping_rates_safe_rate_positive check (safe_source_rate >= 0),
  constraint shipping_rates_unique_slab unique (
    country_code, source_service_id, weight_kg
  )
);

create index shipping_rates_country_service_weight_idx
  on public.shipping_rates (country_code, source_service_id, weight_kg);

create index shipping_rates_active_idx
  on public.shipping_rates (active);

create index shipping_rates_source_service_id_idx
  on public.shipping_rates (source_service_id);

drop trigger if exists shipping_rates_set_updated_at on public.shipping_rates;
create trigger shipping_rates_set_updated_at
before update on public.shipping_rates
for each row execute function public.set_updated_at();

alter table public.shipping_rates enable row level security;
-- No anon/authenticated policies: quotes are computed server-side only.

-- ---------------------------------------------------------------------------
-- shipping_settings (singleton id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_settings (
  id integer primary key check (id = 1),
  shipping_markup_percent numeric(6, 3) not null default 11,
  handling_fee_inr numeric(12, 2) not null default 49,
  service_fee_inr numeric(12, 2) not null default 79,
  gst_rate numeric(6, 4) not null default 0.18,
  volumetric_divisor numeric(12, 2) not null default 5000,
  tax_mode text not null default 'gst_on_indiroute_fees_only',
  economy_enabled boolean not null default true,
  standard_enabled boolean not null default true,
  express_enabled boolean not null default false,
  final_price_round_to_inr numeric(12, 2) not null default 10,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_settings_tax_mode_check check (
    tax_mode in ('gst_on_indiroute_fees_only', 'gst_on_all', 'gst_none')
  )
);

drop trigger if exists shipping_settings_set_updated_at on public.shipping_settings;
create trigger shipping_settings_set_updated_at
before update on public.shipping_settings
for each row execute function public.set_updated_at();

alter table public.shipping_settings enable row level security;

insert into public.shipping_settings (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- packing fee slabs
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_packing_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_packing_fee_slabs_range check (
    max_kg is null or max_kg >= min_kg
  )
);

drop trigger if exists shipping_packing_fee_slabs_set_updated_at
  on public.shipping_packing_fee_slabs;
create trigger shipping_packing_fee_slabs_set_updated_at
before update on public.shipping_packing_fee_slabs
for each row execute function public.set_updated_at();

alter table public.shipping_packing_fee_slabs enable row level security;

delete from public.shipping_packing_fee_slabs;

insert into public.shipping_packing_fee_slabs (min_kg, max_kg, fee_inr, active)
values
  (0, 0.5, 49, true),
  (0.5, 1, 69, true),
  (1, 2, 99, true),
  (2, 5, 149, true),
  (5, 10, 249, true),
  (10, null, 349, true);

-- ---------------------------------------------------------------------------
-- enabled destination countries
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_countries (
  country_code text primary key,
  country_name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shipping_countries_set_updated_at on public.shipping_countries;
create trigger shipping_countries_set_updated_at
before update on public.shipping_countries
for each row execute function public.set_updated_at();

alter table public.shipping_countries enable row level security;

insert into public.shipping_countries (country_code, country_name, enabled)
values
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
on conflict (country_code) do update
set country_name = excluded.country_name,
    enabled = excluded.enabled,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- source service mappings (admin-editable)
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_service_mappings (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.shipping_countries (country_code) on delete cascade,
  country_name text not null,
  customer_tier text not null,
  source_service_id integer not null,
  source_service_name text not null,
  source_sla text not null,
  role text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_service_mappings_tier_check check (
    customer_tier in ('economy', 'standard')
  ),
  constraint shipping_service_mappings_role_check check (
    role in ('preferred', 'fallback', 'candidate')
  )
);

create index if not exists shipping_service_mappings_country_tier_idx
  on public.shipping_service_mappings (country_code, customer_tier, sort_order);

drop trigger if exists shipping_service_mappings_set_updated_at
  on public.shipping_service_mappings;
create trigger shipping_service_mappings_set_updated_at
before update on public.shipping_service_mappings
for each row execute function public.set_updated_at();

alter table public.shipping_service_mappings enable row level security;

delete from public.shipping_service_mappings;

insert into public.shipping_service_mappings (
  country_code, country_name, customer_tier, source_service_id,
  source_service_name, source_sla, role, sort_order, active
) values
${mappings};

-- ---------------------------------------------------------------------------
-- Seed placeholder ratecard rows (replace via admin import with real workbook)
-- India Post IDs 326–329 are intentionally never seeded.
-- ---------------------------------------------------------------------------
insert into public.shipping_rates (
  country_code, country_name, weight_kg, source_service_name, source_service_id,
  source_sla, lite_rate, basic_rate, advanced_rate, pro_rate, enterprise_rate,
  diamond_rate, safe_source_rate, customer_service_tier, active
) values
${rates};

-- ---------------------------------------------------------------------------
-- Allow standard on shipments (express remains; economy unchanged)
-- ---------------------------------------------------------------------------
alter table public.shipments
  drop constraint if exists shipments_service_type_check;

alter table public.shipments
  add constraint shipments_service_type_check
  check (service_type in ('economy', 'standard', 'express'));
`;

fs.writeFileSync(outPath, sql);
console.log(`Wrote ${outPath}`);
