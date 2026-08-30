-- =============================================================================
-- Matchup starting lineups (from Sleeper starters[] / players[])
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

alter table public.matchups
  add column if not exists home_starters jsonb not null default '[]'::jsonb;

alter table public.matchups
  add column if not exists away_starters jsonb not null default '[]'::jsonb;

alter table public.matchups
  add column if not exists home_bench jsonb not null default '[]'::jsonb;

alter table public.matchups
  add column if not exists away_bench jsonb not null default '[]'::jsonb;

comment on column public.matchups.home_starters is
  'Sleeper starting lineup: [{ player_id, name, pos, nfl_team, slot, points }]';
comment on column public.matchups.away_starters is
  'Sleeper starting lineup: [{ player_id, name, pos, nfl_team, slot, points }]';
comment on column public.matchups.home_bench is
  'Sleeper bench (roster players not in starters)';
comment on column public.matchups.away_bench is
  'Sleeper bench (roster players not in starters)';

-- Verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'matchups'
  and column_name in ('home_starters', 'away_starters', 'home_bench', 'away_bench')
order by column_name;
