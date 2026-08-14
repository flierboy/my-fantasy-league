-- =============================================================================
-- Sleeper live-ops metadata (last successful sync timestamp)
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

alter table public.league_settings
  add column if not exists last_sleeper_sync_at timestamptz;

comment on column public.league_settings.last_sleeper_sync_at is
  'Timestamp of the last successful Admin → Sleeper sync (matchups + standings).';
