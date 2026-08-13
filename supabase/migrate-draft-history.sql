-- =============================================================================
-- Draft history (years + picks)
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

-- ---------------------------------------------------------------------------
-- draft_years
-- ---------------------------------------------------------------------------
create table if not exists public.draft_years (
  id uuid primary key default gen_random_uuid(),
  season_year int not null unique,
  source text not null default 'manual'
    check (source in ('espn', 'yahoo', 'sleeper', 'manual')),
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists draft_years_year_idx
  on public.draft_years (season_year desc);

-- ---------------------------------------------------------------------------
-- draft_picks
-- ---------------------------------------------------------------------------
create table if not exists public.draft_picks (
  id uuid primary key default gen_random_uuid(),
  draft_year_id uuid not null references public.draft_years (id) on delete cascade,
  season_year int not null,
  round int not null check (round >= 1),
  pick_in_round int not null check (pick_in_round >= 1),
  overall_pick int not null check (overall_pick >= 1),
  player_name text not null,
  position text,
  nfl_team text,
  fantasy_owner_name text not null default '',
  owner_id uuid references public.owners (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draft_year_id, overall_pick)
);

create index if not exists draft_picks_year_round_idx
  on public.draft_picks (season_year, round, pick_in_round);

create index if not exists draft_picks_owner_idx
  on public.draft_picks (owner_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.draft_years enable row level security;
alter table public.draft_picks enable row level security;

drop policy if exists "draft_years_public_read" on public.draft_years;
create policy "draft_years_public_read" on public.draft_years
  for select using (true);

drop policy if exists "draft_years_admin_all" on public.draft_years;
create policy "draft_years_admin_all" on public.draft_years
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "draft_picks_public_read" on public.draft_picks;
create policy "draft_picks_public_read" on public.draft_picks
  for select using (true);

drop policy if exists "draft_picks_admin_all" on public.draft_picks;
create policy "draft_picks_admin_all" on public.draft_picks
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists draft_years_updated_at on public.draft_years;
create trigger draft_years_updated_at
  before update on public.draft_years
  for each row execute function public.set_updated_at();

drop trigger if exists draft_picks_updated_at on public.draft_picks;
create trigger draft_picks_updated_at
  before update on public.draft_picks
  for each row execute function public.set_updated_at();

select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('draft_years', 'draft_picks')
order by table_name;
