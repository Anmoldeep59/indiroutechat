-- Add sender/store name for inbound parcels (admin receiving flow).

alter table public.parcels
  add column if not exists sender_name text;

create index if not exists parcels_inbound_tracking_number_idx
  on public.parcels (inbound_tracking_number);
