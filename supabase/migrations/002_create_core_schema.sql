-- IndiRoute: core application schema
-- Auth remains in Firebase. Application data lives in Supabase PostgreSQL.

-- Shared updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_profile_id_idx on public.addresses (profile_id);

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lockers (customer India warehouse addresses)
-- ---------------------------------------------------------------------------
create table if not exists public.lockers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  locker_code text not null unique,
  warehouse_name text not null default 'IndiRoute Warehouse',
  line1 text,
  line2 text,
  city text default 'New Delhi',
  state text,
  postal_code text,
  country text not null default 'India',
  status text not null default 'active',
  storage_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lockers_status_check check (status in ('active', 'suspended', 'closed'))
);

create index if not exists lockers_profile_id_idx on public.lockers (profile_id);
create index if not exists lockers_locker_code_idx on public.lockers (locker_code);

drop trigger if exists lockers_set_updated_at on public.lockers;
create trigger lockers_set_updated_at
before update on public.lockers
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- parcels
-- ---------------------------------------------------------------------------
create table if not exists public.parcels (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  locker_id uuid references public.lockers (id) on delete set null,
  inbound_tracking_number text,
  carrier text,
  status text not null default 'in_process',
  weight_kg numeric(10, 3),
  length_cm numeric(10, 2),
  width_cm numeric(10, 2),
  height_cm numeric(10, 2),
  received_at timestamptz,
  free_storage_ends_at timestamptz,
  storage_rate_per_day_inr numeric(10, 2) default 100,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parcels_status_check check (
    status in (
      'in_process',
      'warehouse_received',
      'inspection',
      'ready_for_consolidation',
      'packed',
      'payment_pending',
      'ready_to_ship',
      'shipped',
      'in_transit',
      'delivered'
    )
  )
);

create index if not exists parcels_profile_id_idx on public.parcels (profile_id);
create index if not exists parcels_locker_id_idx on public.parcels (locker_id);
create index if not exists parcels_status_idx on public.parcels (status);

drop trigger if exists parcels_set_updated_at on public.parcels;
create trigger parcels_set_updated_at
before update on public.parcels
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- parcel_items
-- ---------------------------------------------------------------------------
create table if not exists public.parcel_items (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  description text,
  quantity integer not null default 1,
  declared_value numeric(12, 2),
  currency text default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parcel_items_quantity_check check (quantity > 0)
);

create index if not exists parcel_items_parcel_id_idx on public.parcel_items (parcel_id);

drop trigger if exists parcel_items_set_updated_at on public.parcel_items;
create trigger parcel_items_set_updated_at
before update on public.parcel_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- consolidation_requests
-- ---------------------------------------------------------------------------
create table if not exists public.consolidation_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'requested',
  secure_repack boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consolidation_requests_status_check check (
    status in ('requested', 'in_progress', 'completed', 'cancelled')
  )
);

create index if not exists consolidation_requests_profile_id_idx
  on public.consolidation_requests (profile_id);

drop trigger if exists consolidation_requests_set_updated_at on public.consolidation_requests;
create trigger consolidation_requests_set_updated_at
before update on public.consolidation_requests
for each row execute function public.set_updated_at();

create table if not exists public.consolidation_request_parcels (
  consolidation_request_id uuid not null references public.consolidation_requests (id) on delete cascade,
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  primary key (consolidation_request_id, parcel_id)
);

-- ---------------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------------
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  consolidation_request_id uuid references public.consolidation_requests (id) on delete set null,
  status text not null default 'draft',
  destination_country text not null,
  service_type text not null default 'economy',
  weight_kg numeric(10, 3),
  length_cm numeric(10, 2),
  width_cm numeric(10, 2),
  height_cm numeric(10, 2),
  shipping_cost numeric(12, 2),
  currency text not null default 'INR',
  tracking_number text,
  carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipments_service_type_check check (service_type in ('economy', 'express')),
  constraint shipments_status_check check (
    status in (
      'draft',
      'payment_pending',
      'ready_to_ship',
      'shipped',
      'in_transit',
      'delivered',
      'cancelled'
    )
  )
);

create index if not exists shipments_profile_id_idx on public.shipments (profile_id);
create index if not exists shipments_status_idx on public.shipments (status);
create index if not exists shipments_tracking_number_idx on public.shipments (tracking_number);

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tracking_events
-- ---------------------------------------------------------------------------
create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status text not null,
  message text,
  location text,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracking_events_shipment_id_idx on public.tracking_events (shipment_id);

drop trigger if exists tracking_events_set_updated_at on public.tracking_events;
create trigger tracking_events_set_updated_at
before update on public.tracking_events
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- assisted_purchase_requests + items
-- ---------------------------------------------------------------------------
create table if not exists public.assisted_purchase_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'submitted',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assisted_purchase_requests_status_check check (
    status in ('submitted', 'reviewing', 'purchased', 'cancelled', 'failed')
  )
);

create index if not exists assisted_purchase_requests_profile_id_idx
  on public.assisted_purchase_requests (profile_id);

drop trigger if exists assisted_purchase_requests_set_updated_at on public.assisted_purchase_requests;
create trigger assisted_purchase_requests_set_updated_at
before update on public.assisted_purchase_requests
for each row execute function public.set_updated_at();

create table if not exists public.assisted_purchase_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.assisted_purchase_requests (id) on delete cascade,
  product_url text not null,
  product_name text,
  quantity integer not null default 1,
  color text,
  size text,
  special_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assisted_purchase_items_quantity_check check (quantity > 0)
);

create index if not exists assisted_purchase_items_request_id_idx
  on public.assisted_purchase_items (request_id);

drop trigger if exists assisted_purchase_items_set_updated_at on public.assisted_purchase_items;
create trigger assisted_purchase_items_set_updated_at
before update on public.assisted_purchase_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pickup_requests
-- ---------------------------------------------------------------------------
create table if not exists public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  contact_name text,
  phone text,
  pickup_line1 text not null,
  pickup_line2 text,
  city text not null,
  state text,
  postal_code text,
  preferred_date date,
  status text not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pickup_requests_status_check check (
    status in ('requested', 'scheduled', 'picked_up', 'delivered_to_warehouse', 'cancelled')
  )
);

create index if not exists pickup_requests_profile_id_idx on public.pickup_requests (profile_id);

drop trigger if exists pickup_requests_set_updated_at on public.pickup_requests;
create trigger pickup_requests_set_updated_at
before update on public.pickup_requests
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  shipment_id uuid references public.shipments (id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'INR',
  status text not null default 'pending',
  provider text not null default 'stripe',
  stripe_payment_intent_id text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_check check (amount >= 0),
  constraint payments_status_check check (
    status in ('pending', 'requires_action', 'succeeded', 'failed', 'refunded', 'cancelled')
  )
);

create index if not exists payments_profile_id_idx on public.payments (profile_id);
create index if not exists payments_shipment_id_idx on public.payments (shipment_id);
create index if not exists payments_stripe_payment_intent_id_idx
  on public.payments (stripe_payment_intent_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- shipping_rates (configurable; used by calculator)
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  destination_country text not null,
  service_type text not null,
  min_weight_kg numeric(10, 3) not null default 0,
  max_weight_kg numeric(10, 3),
  base_rate numeric(12, 2) not null,
  per_kg_rate numeric(12, 2) not null default 0,
  currency text not null default 'INR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_rates_service_type_check check (service_type in ('economy', 'express')),
  constraint shipping_rates_weight_check check (
    max_weight_kg is null or max_weight_kg >= min_weight_kg
  )
);

create index if not exists shipping_rates_destination_country_idx
  on public.shipping_rates (destination_country);
create index if not exists shipping_rates_active_idx
  on public.shipping_rates (is_active);

drop trigger if exists shipping_rates_set_updated_at on public.shipping_rates;
create trigger shipping_rates_set_updated_at
before update on public.shipping_rates
for each row execute function public.set_updated_at();

-- Seed placeholder international rates (editable later in admin)
insert into public.shipping_rates (
  destination_country, service_type, min_weight_kg, max_weight_kg, base_rate, per_kg_rate, currency, is_active
)
select * from (
  values
    ('Australia', 'economy', 0::numeric, 2::numeric, 1800::numeric, 650::numeric, 'INR', true),
    ('Australia', 'express', 0::numeric, 2::numeric, 2800::numeric, 900::numeric, 'INR', true),
    ('United States', 'economy', 0::numeric, 2::numeric, 2000::numeric, 700::numeric, 'INR', true),
    ('United States', 'express', 0::numeric, 2::numeric, 3200::numeric, 950::numeric, 'INR', true),
    ('United Kingdom', 'economy', 0::numeric, 2::numeric, 1900::numeric, 680::numeric, 'INR', true),
    ('United Kingdom', 'express', 0::numeric, 2::numeric, 3000::numeric, 920::numeric, 'INR', true),
    ('Canada', 'economy', 0::numeric, 2::numeric, 2100::numeric, 720::numeric, 'INR', true),
    ('Canada', 'express', 0::numeric, 2::numeric, 3300::numeric, 980::numeric, 'INR', true),
    ('New Zealand', 'economy', 0::numeric, 2::numeric, 1850::numeric, 670::numeric, 'INR', true),
    ('New Zealand', 'express', 0::numeric, 2::numeric, 2900::numeric, 910::numeric, 'INR', true)
) as seed(destination_country, service_type, min_weight_kg, max_weight_kg, base_rate, per_kg_rate, currency, is_active)
where not exists (select 1 from public.shipping_rates limit 1);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_profile_id_idx on public.notifications (profile_id);
create index if not exists notifications_read_at_idx on public.notifications (read_at);

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_profile_id_idx on public.admin_users (profile_id);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_profile_id_idx on public.audit_logs (actor_profile_id);
create index if not exists audit_logs_entity_type_idx on public.audit_logs (entity_type);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
