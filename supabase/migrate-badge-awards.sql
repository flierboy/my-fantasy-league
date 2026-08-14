-- =============================================================================
-- Weekly badge awards (auto from Sleeper) + auto-award setting
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

-- Persist each weekly award once per owner/badge/week
create table if not exists public.badge_awards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete cascade,
  badge_key text not null,
  season_year int not null,
  week int not null check (week between 1 and 25),
  notes text,
  created_at timestamptz not null default now(),
  unique (owner_id, badge_key, season_year, week)
);

create index if not exists badge_awards_season_week_idx
  on public.badge_awards (season_year desc, week desc);

create index if not exists badge_awards_owner_idx
  on public.badge_awards (owner_id);

create index if not exists badge_awards_badge_idx
  on public.badge_awards (badge_key);

alter table public.badge_awards enable row level security;

drop policy if exists "badge_awards_public_read" on public.badge_awards;
create policy "badge_awards_public_read" on public.badge_awards
  for select using (true);

drop policy if exists "badge_awards_admin_all" on public.badge_awards;
create policy "badge_awards_admin_all" on public.badge_awards
  for all using (public.is_admin()) with check (public.is_admin());

-- League setting: auto-award after Sleeper sync (default on)
alter table public.league_settings
  add column if not exists auto_award_weekly_badges boolean not null default true;

comment on column public.league_settings.auto_award_weekly_badges is
  'When true, evaluate and award weekly badges after a successful Sleeper sync once season is underway.';
