-- =============================================================================
-- Fix draft_picks ownership using serpentine draft orders
-- Run in Supabase SQL Editor (safe to re-run)
-- Does NOT change player names / round / pick numbers — only fantasy owner.
-- =============================================================================

-- Round 1 orders (10 teams). Odd rounds use this order; even rounds reverse.
-- 2025: whit, sco, brown, len, dan, reese, mase, hamie, zack, bish
-- 2024: brown, zack, hamie, sco, mase, dan, whit, len, reese, bish
-- 2023: dan, len, bish, whit, sco, hamie, mase, brown, reese, zack

with orders as (
  select * from (values
    (2025, array['Whit','sco','Brown','Len','yo mama','Reese','Mase','Hamie','Zack','Bish']::text[]),
    (2024, array['Brown','Zack','Hamie','sco','Mase','yo mama','Whit','Len','Reese','Bish']::text[]),
    (2023, array['yo mama','Len','Bish','Whit','sco','Hamie','Mase','Brown','Reese','Zack']::text[])
  ) as t(season_year, r1)
),
computed as (
  select
    dp.id,
    dp.season_year,
    dp.round,
    dp.pick_in_round,
    dp.overall_pick,
    case
      when dp.round % 2 = 1 then o.r1[dp.pick_in_round]
      else o.r1[array_length(o.r1, 1) - dp.pick_in_round + 1]
    end as new_fantasy_owner_name
  from public.draft_picks dp
  join orders o on o.season_year = dp.season_year
),
matched as (
  select
    c.*,
    (
      select ow.id
      from public.owners ow
      where
        case lower(c.new_fantasy_owner_name)
          when 'whit' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(whit|olewhit|whitstits)%'
            or lower(regexp_replace(coalesce(ow.team_name, ''), '[^a-z0-9]+', '', 'g')) similar to '%(whit|olewhit|whitstits)%'
          when 'sco' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(sco|scott)%'
            or lower(regexp_replace(coalesce(ow.team_name, ''), '[^a-z0-9]+', '', 'g')) similar to '%(sco|scott)%'
            or lower(regexp_replace(coalesce(ow.sleeper_username, ''), '[^a-z0-9]+', '', 'g')) similar to '%(sco|scott)%'
          when 'brown' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(brown|bigbrownstain|bbs)%'
            or lower(regexp_replace(coalesce(ow.team_name, ''), '[^a-z0-9]+', '', 'g')) similar to '%(brown|bigbrownstain)%'
          when 'len' then
            -- Prefer exact "Len" over "Lens daddy"
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) in ('len', 'thickylen', 'leonidaslen', 'leonidas')
            or lower(ow.display_name) = 'Len'
          when 'yo mama' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(yomama|yomomma|yourmama)%'
            or lower(ow.display_name) ilike 'yo mama%'
          when 'reese' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(reese|reesee)%'
            or lower(regexp_replace(coalesce(ow.team_name, ''), '[^a-z0-9]+', '', 'g')) similar to '%(reese|reesee)%'
          when 'mase' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(mase|maison|playofflock)%'
            or lower(regexp_replace(coalesce(ow.team_name, ''), '[^a-z0-9]+', '', 'g')) similar to '%(mase|maison)%'
          when 'hamie' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(hamie|hambone|ham)%'
            or lower(ow.display_name) ilike '%ham%'
          when 'zack' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(zack|zach)%'
            or lower(regexp_replace(coalesce(ow.team_name, ''), '[^a-z0-9]+', '', 'g')) similar to '%(zack|zach)%'
          when 'bish' then
            lower(regexp_replace(ow.display_name, '[^a-z0-9]+', '', 'g')) similar to '%(bish|lloyd|benny|backshots)%'
            or lower(ow.display_name) ilike '%lloyd%'
            or lower(ow.display_name) ilike '%benny%'
          else false
        end
      order by
        -- Prefer stronger matches
        case
          when lower(ow.display_name) = lower(c.new_fantasy_owner_name) then 0
          when lower(ow.display_name) = 'len' and lower(c.new_fantasy_owner_name) = 'len' then 0
          when lower(ow.display_name) = 'yo mama' and lower(c.new_fantasy_owner_name) = 'yo mama' then 0
          when lower(ow.display_name) ilike '%bigbrown%' and lower(c.new_fantasy_owner_name) = 'brown' then 1
          when lower(ow.display_name) ilike '%whit%' and lower(c.new_fantasy_owner_name) = 'whit' then 1
          when lower(ow.display_name) ilike '%lloyd%' and lower(c.new_fantasy_owner_name) = 'bish' then 1
          when lower(ow.display_name) ilike '%ham%' and lower(c.new_fantasy_owner_name) = 'hamie' then 1
          when lower(ow.display_name) ilike '%mase%' and lower(c.new_fantasy_owner_name) = 'mase' then 1
          else 5
        end,
        ow.sort_order
      limit 1
    ) as new_owner_id
  from computed c
)
update public.draft_picks dp
set
  fantasy_owner_name = m.new_fantasy_owner_name,
  owner_id = m.new_owner_id,
  updated_at = now()
from matched m
where dp.id = m.id;

-- Verification: Round 1 owners (must be 10 unique per year)
select
  season_year,
  pick_in_round,
  overall_pick,
  fantasy_owner_name,
  (select display_name from public.owners o where o.id = draft_picks.owner_id) as matched_owner
from public.draft_picks
where round = 1
  and season_year in (2023, 2024, 2025)
order by season_year, pick_in_round;

-- Verification: no owner with multiple first-round picks
select
  season_year,
  fantasy_owner_name,
  count(*) as r1_picks
from public.draft_picks
where round = 1
  and season_year in (2023, 2024, 2025)
group by season_year, fantasy_owner_name
having count(*) > 1;

-- Spot-check serpentine (R1 pick 1 == R2 pick 10, etc.)
select
  season_year,
  round,
  pick_in_round,
  fantasy_owner_name
from public.draft_picks
where season_year = 2025
  and (
    (round = 1 and pick_in_round in (1, 2, 10))
    or (round = 2 and pick_in_round in (1, 2, 10))
    or (round = 3 and pick_in_round in (1, 2, 10))
  )
order by round, pick_in_round;
