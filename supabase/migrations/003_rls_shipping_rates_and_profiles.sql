-- Public read access for active shipping rates (calculator).
-- Writes remain locked down for authenticated/service roles later.

alter table public.shipping_rates enable row level security;

drop policy if exists "Allow public read of active shipping rates" on public.shipping_rates;

create policy "Allow public read of active shipping rates"
on public.shipping_rates
for select
to anon, authenticated
using (is_active = true);

-- Profiles are managed via server API with service role.
-- Enable RLS so the anon key cannot freely rewrite profile rows.
alter table public.profiles enable row level security;

drop policy if exists "Profiles are not publicly readable" on public.profiles;
-- No public policies on purpose: access via service role / future secured policies.
