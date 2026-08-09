-- IndiRoute: consolidation → quote → Stripe payment workflow
-- Extends existing parcels, consolidation_requests, shipments, payments, addresses.

-- ---------------------------------------------------------------------------
-- Parcel reference sequence + columns
-- ---------------------------------------------------------------------------
create sequence if not exists public.parcel_reference_seq start 100001;

alter table public.parcels
  add column if not exists reference_code text,
  add column if not exists description text,
  add column if not exists photo_url text;

update public.parcels
set reference_code = 'IRP-' || lpad(nextval('public.parcel_reference_seq')::text, 6, '0')
where reference_code is null;

alter table public.parcels
  alter column reference_code set not null;

create unique index if not exists parcels_reference_code_uidx
  on public.parcels (reference_code);

alter table public.parcels drop constraint if exists parcels_status_check;
alter table public.parcels
  add constraint parcels_status_check check (
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
      'delivered',
      'consolidated',
      'assigned_to_shipment'
    )
  );

-- ---------------------------------------------------------------------------
-- Consolidation request extensions
-- ---------------------------------------------------------------------------
alter table public.consolidation_requests
  add column if not exists locker_id uuid references public.lockers (id) on delete set null,
  add column if not exists customer_notes text,
  add column if not exists packing_notes text,
  add column if not exists final_weight_kg numeric(10, 3),
  add column if not exists final_length_cm numeric(10, 2),
  add column if not exists final_width_cm numeric(10, 2),
  add column if not exists final_height_cm numeric(10, 2),
  add column if not exists final_pieces integer default 1,
  add column if not exists packing_fee_override numeric(12, 2),
  add column if not exists active_quote_id uuid;

alter table public.consolidation_requests
  drop constraint if exists consolidation_requests_status_check;

alter table public.consolidation_requests
  add constraint consolidation_requests_status_check check (
    status in (
      'requested',
      'processing',
      'quoted',
      'awaiting_payment',
      'completed',
      'cancelled',
      'expired'
    )
  );

create index if not exists consolidation_requests_locker_id_idx
  on public.consolidation_requests (locker_id);

create index if not exists consolidation_requests_status_idx
  on public.consolidation_requests (status);

-- ---------------------------------------------------------------------------
-- Shipping quotes (server-authored; source courier kept internal)
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  consolidation_request_id uuid not null references public.consolidation_requests (id) on delete cascade,
  final_weight_kg numeric(10, 3) not null,
  final_length_cm numeric(10, 2) not null,
  final_width_cm numeric(10, 2) not null,
  final_height_cm numeric(10, 2) not null,
  final_pieces integer not null default 1,
  chargeable_weight_kg numeric(10, 3) not null,
  destination_country_code text,
  currency text not null default 'INR',
  economy_price numeric(12, 2),
  economy_eta text,
  economy_available boolean not null default false,
  economy_source_service_id integer,
  economy_source_service_name text,
  economy_source_sla text,
  economy_source_rate numeric(12, 2),
  standard_price numeric(12, 2),
  standard_eta text,
  standard_available boolean not null default false,
  standard_source_service_id integer,
  standard_source_service_name text,
  standard_source_sla text,
  standard_source_rate numeric(12, 2),
  packing_fee_inr numeric(12, 2),
  quote_payload jsonb not null default '{}'::jsonb,
  status text not null default 'quoted',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_quotes_status_check check (
    status in ('quoted', 'selected', 'paid', 'expired', 'cancelled')
  )
);

create index if not exists shipping_quotes_profile_id_idx
  on public.shipping_quotes (profile_id);

create index if not exists shipping_quotes_request_id_idx
  on public.shipping_quotes (consolidation_request_id);

drop trigger if exists shipping_quotes_set_updated_at on public.shipping_quotes;
create trigger shipping_quotes_set_updated_at
before update on public.shipping_quotes
for each row execute function public.set_updated_at();

alter table public.consolidation_requests
  drop constraint if exists consolidation_requests_active_quote_fk;

alter table public.consolidation_requests
  add constraint consolidation_requests_active_quote_fk
  foreign key (active_quote_id) references public.shipping_quotes (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- Shipments: payment + delivery snapshot + quote link
-- ---------------------------------------------------------------------------
alter table public.shipments
  add column if not exists quote_id uuid references public.shipping_quotes (id) on delete set null,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists delivery_full_name text,
  add column if not exists delivery_phone text,
  add column if not exists delivery_email text,
  add column if not exists delivery_line1 text,
  add column if not exists delivery_line2 text,
  add column if not exists delivery_city text,
  add column if not exists delivery_state text,
  add column if not exists delivery_postal_code text,
  add column if not exists delivery_country text,
  add column if not exists delivery_instructions text,
  add column if not exists parcel_count integer,
  add column if not exists selected_tier text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists paid_at timestamptz;

alter table public.shipments
  drop constraint if exists shipments_status_check;

alter table public.shipments
  add constraint shipments_status_check check (
    status in (
      'draft',
      'awaiting_payment',
      'payment_pending',
      'ready_to_ship',
      'shipped',
      'in_transit',
      'delivered',
      'cancelled'
    )
  );

alter table public.shipments
  drop constraint if exists shipments_payment_status_check;

alter table public.shipments
  add constraint shipments_payment_status_check check (
    payment_status in ('pending', 'paid', 'failed', 'expired', 'refunded')
  );

alter table public.shipments
  drop constraint if exists shipments_selected_tier_check;

alter table public.shipments
  add constraint shipments_selected_tier_check check (
    selected_tier is null or selected_tier in ('economy', 'standard')
  );

create unique index if not exists shipments_stripe_checkout_session_uidx
  on public.shipments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists public.shipment_parcels (
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  parcel_id uuid not null references public.parcels (id) on delete restrict,
  primary key (shipment_id, parcel_id)
);

create index if not exists shipment_parcels_parcel_id_idx
  on public.shipment_parcels (parcel_id);

-- ---------------------------------------------------------------------------
-- Payments extensions
-- ---------------------------------------------------------------------------
alter table public.payments
  add column if not exists quote_id uuid references public.shipping_quotes (id) on delete set null,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists paid_at timestamptz;

alter table public.payments
  drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check check (
    status in (
      'pending',
      'requires_action',
      'succeeded',
      'paid',
      'failed',
      'refunded',
      'cancelled',
      'expired'
    )
  );

create unique index if not exists payments_stripe_checkout_session_uidx
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists payments_stripe_payment_intent_uidx
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ---------------------------------------------------------------------------
-- Quote validity setting
-- ---------------------------------------------------------------------------
alter table public.shipping_settings
  add column if not exists quote_validity_hours integer not null default 24;

-- ---------------------------------------------------------------------------
-- Prevent a parcel from joining multiple open consolidation requests
-- ---------------------------------------------------------------------------
create or replace function public.parcel_in_open_consolidation(p_parcel_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.consolidation_request_parcels crp
    join public.consolidation_requests cr
      on cr.id = crp.consolidation_request_id
    where crp.parcel_id = p_parcel_id
      and cr.status in ('requested', 'processing', 'quoted', 'awaiting_payment')
  );
$$;

create or replace function public.enforce_parcel_not_in_open_consolidation()
returns trigger
language plpgsql
as $$
begin
  if public.parcel_in_open_consolidation(new.parcel_id) then
    -- Allow re-insert only for the same request during updates; for insert check others
    if tg_op = 'INSERT' then
      if exists (
        select 1
        from public.consolidation_request_parcels crp
        join public.consolidation_requests cr
          on cr.id = crp.consolidation_request_id
        where crp.parcel_id = new.parcel_id
          and cr.status in ('requested', 'processing', 'quoted', 'awaiting_payment')
          and cr.id <> new.consolidation_request_id
      ) then
        raise exception 'Parcel is already part of an open consolidation request';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists consolidation_request_parcels_enforce_open
  on public.consolidation_request_parcels;

create trigger consolidation_request_parcels_enforce_open
before insert on public.consolidation_request_parcels
for each row execute function public.enforce_parcel_not_in_open_consolidation();

-- ---------------------------------------------------------------------------
-- Parcel reference helper
-- ---------------------------------------------------------------------------
create or replace function public.next_parcel_reference()
returns text
language sql
as $$
  select 'IRP-' || lpad(nextval('public.parcel_reference_seq')::text, 6, '0');
$$;
