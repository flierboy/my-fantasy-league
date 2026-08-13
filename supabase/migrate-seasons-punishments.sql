-- =============================================================================
-- Past seasons (manual standings) + punishments (Wall of Shame)
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers (safe if already defined from main schema)
-- ---------------------------------------------------------------------------
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
-- past_seasons: one row per completed league year
-- ---------------------------------------------------------------------------
create table if not exists public.past_seasons (
  id uuid primary key default gen_random_uuid(),
  season_year int not null unique,
  label text not null default '',
  recap_notes text,
  champion_owner_id uuid references public.owners (id) on delete set null,
  runner_up_owner_id uuid references public.owners (id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists past_seasons_year_idx
  on public.past_seasons (season_year desc);

-- ---------------------------------------------------------------------------
-- past_season_standings: full table for each past season
-- ---------------------------------------------------------------------------
create table if not exists public.past_season_standings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.past_seasons (id) on delete cascade,
  owner_id uuid references public.owners (id) on delete set null,
  team_name text,
  wins int not null default 0 check (wins >= 0),
  losses int not null default 0 check (losses >= 0),
  ties int not null default 0 check (ties >= 0),
  points_for numeric(10, 2) not null default 0,
  points_against numeric(10, 2) not null default 0,
  rank int not null default 0 check (rank >= 0),
  is_champion boolean not null default false,
  is_runner_up boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, owner_id)
);

create index if not exists past_season_standings_season_rank_idx
  on public.past_season_standings (season_id, rank);

-- ---------------------------------------------------------------------------
-- punishments: Wall of Shame entries
-- ---------------------------------------------------------------------------
create table if not exists public.punishments (
  id uuid primary key default gen_random_uuid(),
  season_year int not null,
  owner_id uuid references public.owners (id) on delete set null,
  -- Display name if owner unlinked / renamed
  owner_label text,
  title text not null default 'Punishment',
  description text not null default '',
  photo_url text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists punishments_year_idx
  on public.punishments (season_year desc, sort_order);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.past_seasons enable row level security;
alter table public.past_season_standings enable row level security;
alter table public.punishments enable row level security;

drop policy if exists "past_seasons_public_read" on public.past_seasons;
create policy "past_seasons_public_read" on public.past_seasons
  for select using (true);

drop policy if exists "past_seasons_admin_all" on public.past_seasons;
create policy "past_seasons_admin_all" on public.past_seasons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "past_season_standings_public_read" on public.past_season_standings;
create policy "past_season_standings_public_read" on public.past_season_standings
  for select using (true);

drop policy if exists "past_season_standings_admin_all" on public.past_season_standings;
create policy "past_season_standings_admin_all" on public.past_season_standings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "punishments_public_read" on public.punishments;
create policy "punishments_public_read" on public.punishments
  for select using (true);

drop policy if exists "punishments_admin_all" on public.punishments;
create policy "punishments_admin_all" on public.punishments
  for all using (public.is_admin()) with check (public.is_admin());

-- updated_at triggers
drop trigger if exists past_seasons_updated_at on public.past_seasons;
create trigger past_seasons_updated_at
  before update on public.past_seasons
  for each row execute function public.set_updated_at();

drop trigger if exists past_season_standings_updated_at on public.past_season_standings;
create trigger past_season_standings_updated_at
  before update on public.past_season_standings
  for each row execute function public.set_updated_at();

drop trigger if exists punishments_updated_at on public.punishments;
create trigger punishments_updated_at
  before update on public.punishments
  for each row execute function public.set_updated_at();

-- Verify
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('past_seasons', 'past_season_standings', 'punishments')
order by table_name;
