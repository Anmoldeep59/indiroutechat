-- Separate IndiRoute fee slabs + updated margin brackets for Aramex transport pricing.
-- Does NOT invent Aramex base rates. Does NOT change Economy/Standard SLA mappings.

-- ---------------------------------------------------------------------------
-- Margin brackets (modest margins on Aramex transport cost)
-- ---------------------------------------------------------------------------
delete from public.shipping_margin_brackets;

insert into public.shipping_margin_brackets (
  min_amount_inr, max_amount_inr, margin_percent, sort_order, active
) values
  (0, 1000, 12, 1, true),
  (1001, 2500, 10, 2, true),
  (2501, 5000, 8, 3, true),
  (5000.01, null, 6, 4, true);

-- ---------------------------------------------------------------------------
-- Handling fee slabs
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_handling_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_handling_fee_slabs_range check (
    max_kg is null or max_kg >= min_kg
  )
);

drop trigger if exists shipping_handling_fee_slabs_set_updated_at
  on public.shipping_handling_fee_slabs;
create trigger shipping_handling_fee_slabs_set_updated_at
before update on public.shipping_handling_fee_slabs
for each row execute function public.set_updated_at();

alter table public.shipping_handling_fee_slabs enable row level security;

delete from public.shipping_handling_fee_slabs;
insert into public.shipping_handling_fee_slabs (min_kg, max_kg, fee_inr, active)
values
  (0, 0.5, 49, true),
  (0.5, 1, 69, true),
  (1, 2, 89, true),
  (2, 5, 129, true),
  (5, 10, 199, true),
  (10, 20, 299, true),
  (20, 30, 399, true);

-- ---------------------------------------------------------------------------
-- Service fee slabs
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_service_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_service_fee_slabs_range check (
    max_kg is null or max_kg >= min_kg
  )
);

drop trigger if exists shipping_service_fee_slabs_set_updated_at
  on public.shipping_service_fee_slabs;
create trigger shipping_service_fee_slabs_set_updated_at
before update on public.shipping_service_fee_slabs
for each row execute function public.set_updated_at();

alter table public.shipping_service_fee_slabs enable row level security;

delete from public.shipping_service_fee_slabs;
insert into public.shipping_service_fee_slabs (min_kg, max_kg, fee_inr, active)
values
  (0, 0.5, 79, true),
  (0.5, 1, 99, true),
  (1, 2, 129, true),
  (2, 5, 179, true),
  (5, 10, 249, true),
  (10, 20, 349, true),
  (20, 30, 499, true);

-- ---------------------------------------------------------------------------
-- Repacking / packing fee slabs
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_repacking_fee_slabs (
  id uuid primary key default gen_random_uuid(),
  min_kg numeric(10, 3) not null,
  max_kg numeric(10, 3),
  fee_inr numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_repacking_fee_slabs_range check (
    max_kg is null or max_kg >= min_kg
  )
);

drop trigger if exists shipping_repacking_fee_slabs_set_updated_at
  on public.shipping_repacking_fee_slabs;
create trigger shipping_repacking_fee_slabs_set_updated_at
before update on public.shipping_repacking_fee_slabs
for each row execute function public.set_updated_at();

alter table public.shipping_repacking_fee_slabs enable row level security;

delete from public.shipping_repacking_fee_slabs;
insert into public.shipping_repacking_fee_slabs (min_kg, max_kg, fee_inr, active)
values
  (0, 0.5, 49, true),
  (0.5, 1, 69, true),
  (1, 2, 99, true),
  (2, 5, 149, true),
  (5, 10, 249, true),
  (10, 20, 399, true),
  (20, 30, 599, true);

-- Keep packing slabs in sync for legacy readers
delete from public.shipping_packing_fee_slabs;
insert into public.shipping_packing_fee_slabs (min_kg, max_kg, fee_inr, active)
select min_kg, max_kg, fee_inr, active from public.shipping_repacking_fee_slabs;
