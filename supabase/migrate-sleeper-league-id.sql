-- =============================================================================
-- Persist Sleeper league id for deep links + sync default
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

alter table public.league_settings
  add column if not exists sleeper_league_id text;

comment on column public.league_settings.sleeper_league_id is
  'Sleeper fantasy league id used for sync and Open in Sleeper links.';

-- Seed known Upper Deckcers league when blank
update public.league_settings
set sleeper_league_id = '1393362654227099648'
where id = 1
  and (sleeper_league_id is null or btrim(sleeper_league_id) = '');

select id, sleeper_league_id, name
from public.league_settings
where id = 1;
