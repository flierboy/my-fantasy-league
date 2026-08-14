-- =============================================================================
-- Constitution sections (editable from Admin → Constitution)
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

create table if not exists public.constitution_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  title text not null,
  body text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_key)
);

create index if not exists constitution_sections_sort_idx
  on public.constitution_sections (sort_order, title);

alter table public.constitution_sections enable row level security;

drop policy if exists "constitution_sections_public_read" on public.constitution_sections;
create policy "constitution_sections_public_read" on public.constitution_sections
  for select using (true);

drop policy if exists "constitution_sections_admin_all" on public.constitution_sections;
create policy "constitution_sections_admin_all" on public.constitution_sections
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists constitution_sections_updated_at on public.constitution_sections;
create trigger constitution_sections_updated_at
  before update on public.constitution_sections
  for each row execute function public.set_updated_at();

-- Intro blurb on the public constitution page
alter table public.league_settings
  add column if not exists constitution_intro text;

comment on column public.league_settings.constitution_intro is
  'Opening paragraph for /constitution. Null = use site default intro.';

-- Seed default sections only when table is empty
insert into public.constitution_sections (section_key, title, body, sort_order)
select v.section_key, v.title, v.body, v.sort_order
from (values
  (
    'format',
    'League format',
    E'10-team Yahoo Fantasy Football league.\nHead-to-head matchups each week during the regular season.\nPlayoffs determine the champion and the hardware.',
    10
  ),
  (
    'roster',
    'Roster',
    E'Standard Yahoo roster slots unless the league votes otherwise before the draft.\nOwners are responsible for setting a valid lineup before the first game of the week kicks off.\nEmpty or illegal lineups forfeit all points from empty slots.',
    20
  ),
  (
    'scoring',
    'Scoring',
    E'Scoring follows the league''s Yahoo settings (PPR / half-PPR / standard as configured).\nYahoo''s official scoring and stats are final unless a clear platform error is proven.\nTies in weekly matchups count as ties in the standings.',
    30
  ),
  (
    'keepers',
    'Keepers',
    E'Keeper rules are announced before the draft and must be declared by the published deadline.\nDefault framework: limited keepers with a maximum number of seasons retained (see league settings).\nFailed or late keeper declarations default to no keepers for that franchise.',
    40
  ),
  (
    'draft',
    'Draft rules',
    E'Draft: Sunday, August 30, 2026 at 3:45 PM EDT.\nSnake draft order is published on the league site and may be adjusted only by commissioner agreement before the draft starts.\nNo-shows may be autodrafted. Clock is law.\nTrades of draft picks, if allowed, must be completed before the draft begins unless otherwise stated.',
    50
  ),
  (
    'trades',
    'Trades & waivers',
    E'Trades are allowed until the league trade deadline set in Yahoo.\nThe commissioner may veto only for clear collusion or catastrophic imbalance — not for “I don’t like it.”\nWaiver priority follows Yahoo league settings.',
    60
  ),
  (
    'dues',
    'Dues & prize money',
    E'Season dues are set in league settings and tracked on the Dues page.\nUnpaid dues may restrict playoff eligibility or prize payout at the commissioner’s discretion.\nPrize pool distribution (champion, runner-up, etc.) is announced before week 1.',
    70
  ),
  (
    'fines',
    'Fines',
    E'Missed lineup with multiple empty starters: fine at commissioner discretion.\nChronic inactivity or tanking may result in fines, loss of draft capital, or removal.\nFines, if assessed, are added to the prize pool unless otherwise agreed.',
    80
  ),
  (
    'punishments',
    'Punishments',
    E'Last place may face a league punishment (content, attire, or task) voted or set preseason.\nPunishment must be completed before the next draft or as otherwise scheduled.\nFailure to complete a punishment may carry over penalties into the following season.',
    90
  ),
  (
    'conduct',
    'Conduct',
    E'Trash talk is encouraged. Harassment, threats, or bigotry are not.\nThe commissioner may remove posts or owners who cross the line.\nAll owners agree to keep the league fun, competitive, and solvent.',
    100
  ),
  (
    'amendments',
    'Amendments',
    E'Rule changes require commissioner proposal and majority owner approval, unless emergency platform fixes are required.\nThis document may be updated on the site; material changes should be announced in trash talk or a poll.',
    110
  ),
  (
    'other',
    'Other',
    E'Anything not covered above falls under commissioner discretion and common sense.',
    120
  )
) as v(section_key, title, body, sort_order)
where not exists (select 1 from public.constitution_sections limit 1);

-- Default intro if empty
update public.league_settings
set constitution_intro = coalesce(
  nullif(trim(constitution_intro), ''),
  'This is the Upper Deckcers constitution. It is binding unless the commissioner and a majority of owners agree to change it. Ignorance is not a defense. Read it. Live it.'
)
where id = 1
  and (constitution_intro is null or trim(constitution_intro) = '');
