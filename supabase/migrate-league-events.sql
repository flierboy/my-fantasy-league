-- =============================================================================
-- League events (Hub upcoming + daily popup)
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.owners o
    where o.user_id = auth.uid() and o.is_admin = true
  );
$$;

create table if not exists public.league_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  location text,
  kind text not null default 'event',
  created_at timestamptz not null default now()
);

create index if not exists league_events_starts_at_idx
  on public.league_events (starts_at asc);

alter table public.league_events enable row level security;

drop policy if exists "league_events_public_read" on public.league_events;
create policy "league_events_public_read" on public.league_events
  for select using (true);

drop policy if exists "league_events_admin_all" on public.league_events;
create policy "league_events_admin_all" on public.league_events
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed UFD Draft only when the table has no rows
-- Sunday Aug 30, 2026 3:45 PM America/New_York = 19:45 UTC (EDT)
insert into public.league_events (title, starts_at, location, kind)
select
  'UFD Draft',
  '2026-08-30T19:45:00.000Z'::timestamptz,
  null,
  'draft'
where not exists (select 1 from public.league_events limit 1);

-- Verify
select id, title, starts_at, location, kind
from public.league_events
order by starts_at;
