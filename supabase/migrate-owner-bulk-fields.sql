-- =============================================================================
-- Migration: bulk owner setup fields
-- Run once in Supabase SQL Editor
-- =============================================================================

-- Favorite NFL team (shown on player cards)
alter table public.owners
  add column if not exists favorite_nfl_team text;

-- Optional Sleeper display/username for roster matching during sync
alter table public.owners
  add column if not exists sleeper_username text;

comment on column public.owners.favorite_nfl_team is
  'Favorite NFL team (abbr or full name), e.g. KC, DAL, PHI';

comment on column public.owners.sleeper_username is
  'Sleeper username or display name used when matching rosters during sync';

-- Verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'owners'
  and column_name in ('favorite_nfl_team', 'sleeper_username', 'role', 'avatar_url');
