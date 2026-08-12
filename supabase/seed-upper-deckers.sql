-- =============================================================================
-- ONE-TIME SEED: Upper Deckcers roster + league name
-- =============================================================================
-- PURPOSE
--   Overwrite public.owners with the real Yahoo 10-team roster and set
--   league_settings.name = 'Upper Deckcers'.
--
-- SAFE TO RE-RUN?
--   Yes, but DESTRUCTIVE: deletes all owners and related rows
--   (matchups, standings, dues, polls, trash talk), then re-inserts the 10 teams.
--   Run only when you intentionally want a full roster reset.
--
-- HOW TO RUN (recommended)
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New query
--   3. Paste this entire file
--   4. Click Run
--   5. Confirm the verification SELECTs at the bottom
--
-- NOTE
--   The SQL Editor runs as a privileged role and bypasses RLS.
--   The app's anon key cannot do this (writes are admin-only).
-- =============================================================================

begin;

-- 1) League settings
-- Ensure draft_at column exists (safe if already added)
alter table public.league_settings
  add column if not exists draft_at timestamptz;

insert into public.league_settings (id, name, tagline, rules_summary, season_year, draft_at)
values (
  1,
  'Upper Deckcers',
  'Fantasy Football League',
  'Draft: Sunday, August 30, 2026 · 3:45 PM EDT',
  2026,
  '2026-08-30T19:45:00+00:00'
)
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  rules_summary = excluded.rules_summary,
  season_year = excluded.season_year,
  draft_at = excluded.draft_at,
  updated_at = now();

update public.league_settings
set
  name = 'Upper Deckcers',
  tagline = 'Fantasy Football League',
  rules_summary = 'Draft: Sunday, August 30, 2026 · 3:45 PM EDT',
  draft_at = '2026-08-30T19:45:00+00:00',
  season_year = 2026,
  updated_at = now()
where id = 1;

-- 2) Clear dependent data, then owners
--    (order matters for foreign keys)
delete from public.trash_talk_posts;
delete from public.poll_votes;
delete from public.polls;
delete from public.due_payments;
delete from public.matchups;
delete from public.standings;
delete from public.owners;

-- 3) Insert 10 Upper Deckcers teams
--    wins/losses/ties = 0, prize_money = 0, badges empty, is_admin = false
--    draft_slot + sort_order = 1..10
insert into public.owners (
  display_name,
  team_name,
  wins,
  losses,
  ties,
  prize_money,
  badges,
  is_admin,
  draft_slot,
  sort_order,
  user_id,
  avatar_url,
  email
) values
  ('Len',               'Len',               0, 0, 0, 0, '{}'::text[], true,   1,  1, null, null, null),
  ('BIGBROWNSTAIN',     'BIGBROWNSTAIN',     0, 0, 0, 0, '{}'::text[], false,  2,  2, null, null, null),
  ('Big Lloyd',         'Big Lloyd',         0, 0, 0, 0, '{}'::text[], false,  3,  3, null, null, null),
  ('WhitsTits',         'WhitsTits',         0, 0, 0, 0, '{}'::text[], false,  4,  4, null, null, null),
  ('HAM BONE',          'HAM BONE',          0, 0, 0, 0, '{}'::text[], false,  5,  5, null, null, null),
  ('Playoff lock mase', 'Playoff lock mase', 0, 0, 0, 0, '{}'::text[], false,  6,  6, null, null, null),
  ('yo mama',           'yo mama',           0, 0, 0, 0, '{}'::text[], true,   7,  7, null, null, null),
  ('Lens daddy',        'Lens daddy',        0, 0, 0, 0, '{}'::text[], false,  8,  8, null, null, null),
  ('Starvin Marvin',    'Starvin Marvin',    0, 0, 0, 0, '{}'::text[], false,  9,  9, null, null, null),
  ('Benny Backshots',   'Benny Backshots',   0, 0, 0, 0, '{}'::text[], false, 10, 10, null, null, null);

commit;

-- 4) Verification (run automatically after the script)
select id, name, tagline, rules_summary, season_year
from public.league_settings
where id = 1;

select
  draft_slot,
  display_name,
  team_name,
  wins,
  losses,
  ties,
  prize_money,
  badges,
  is_admin
from public.owners
order by draft_slot;
