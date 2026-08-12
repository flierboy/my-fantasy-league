-- =============================================================================
-- Yahoo Keepers League — Supabase schema
-- Run this in the Supabase SQL editor (or via supabase db push).
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- owners
-- One row per franchise. Linked to auth.users when the owner has a login.
-- Only admins create accounts (no public sign-up); link user_id after invite.
-- -----------------------------------------------------------------------------
create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  display_name text not null,
  team_name text,
  avatar_url text,
  email text,
  wins int not null default 0 check (wins >= 0),
  losses int not null default 0 check (losses >= 0),
  ties int not null default 0 check (ties >= 0),
  prize_money numeric(10, 2) not null default 0 check (prize_money >= 0),
  badges text[] not null default '{}',
  is_admin boolean not null default false,
  draft_slot int unique check (draft_slot is null or draft_slot between 1 and 20),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists owners_draft_slot_idx on public.owners (draft_slot);
create index if not exists owners_sort_order_idx on public.owners (sort_order);

-- -----------------------------------------------------------------------------
-- league_settings (single-row config for homepage copy)
-- -----------------------------------------------------------------------------
create table if not exists public.league_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'Upper Deckers',
  tagline text not null default 'Fantasy Football League',
  rules_summary text not null default 'Draft: Sunday, August 30, 2026 · 3:45 PM EDT',
  dues_amount numeric(10, 2) not null default 250,
  keeper_count int not null default 1,
  keeper_max_seasons int not null default 2,
  season_year int not null default 2026,
  trophy_blurb text not null default 'The prize every season. One champion.',
  draft_at timestamptz default '2026-08-30T19:45:00+00:00',
  updated_at timestamptz not null default now()
);

insert into public.league_settings (id) values (1)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- standings (per season; optional per-week snapshots)
-- -----------------------------------------------------------------------------
create table if not exists public.standings (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  week int, -- null = season-to-date
  owner_id uuid not null references public.owners (id) on delete cascade,
  wins int not null default 0,
  losses int not null default 0,
  ties int not null default 0,
  points_for numeric(8, 2) not null default 0,
  points_against numeric(8, 2) not null default 0,
  rank int not null default 0,
  unique (season, week, owner_id)
);

create index if not exists standings_season_idx on public.standings (season, week);

-- -----------------------------------------------------------------------------
-- matchups
-- -----------------------------------------------------------------------------
create table if not exists public.matchups (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  week int not null check (week between 1 and 20),
  home_owner_id uuid not null references public.owners (id) on delete cascade,
  away_owner_id uuid not null references public.owners (id) on delete cascade,
  home_score numeric(8, 2),
  away_score numeric(8, 2),
  is_playoff boolean not null default false,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  check (home_owner_id <> away_owner_id)
);

create index if not exists matchups_season_week_idx on public.matchups (season, week);

-- -----------------------------------------------------------------------------
-- dues / prize tracker
-- -----------------------------------------------------------------------------
create table if not exists public.due_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete cascade,
  season int not null,
  amount_due numeric(10, 2) not null,
  amount_paid numeric(10, 2) not null default 0,
  paid_at timestamptz,
  notes text,
  unique (owner_id, season)
);

-- -----------------------------------------------------------------------------
-- polls + votes
-- -----------------------------------------------------------------------------
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  options text[] not null check (cardinality(options) >= 2),
  created_by uuid references public.owners (id) on delete set null,
  is_active boolean not null default true,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  owner_id uuid not null references public.owners (id) on delete cascade,
  option_index int not null check (option_index >= 0),
  created_at timestamptz not null default now(),
  unique (poll_id, owner_id)
);

create index if not exists poll_votes_poll_idx on public.poll_votes (poll_id);

-- -----------------------------------------------------------------------------
-- trash talk (enable Realtime on this table in Supabase dashboard)
-- -----------------------------------------------------------------------------
create table if not exists public.trash_talk_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists trash_talk_created_idx
  on public.trash_talk_posts (created_at desc);

-- Realtime publication (ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table public.trash_talk_posts;
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- updated_at helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists owners_updated_at on public.owners;
create trigger owners_updated_at
  before update on public.owners
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- Public read for homepage-facing tables; write restricted to admins.
-- Authenticated members can vote + post trash talk.
-- -----------------------------------------------------------------------------
alter table public.owners enable row level security;
alter table public.league_settings enable row level security;
alter table public.standings enable row level security;
alter table public.matchups enable row level security;
alter table public.due_payments enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.trash_talk_posts enable row level security;

-- Helper: is the current user an admin owner?
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

create or replace function public.current_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select o.id from public.owners o where o.user_id = auth.uid() limit 1;
$$;

-- owners: public read; admin write
create policy "owners_public_read" on public.owners
  for select using (true);

create policy "owners_admin_all" on public.owners
  for all using (public.is_admin()) with check (public.is_admin());

-- league_settings: public read; admin write
create policy "league_settings_public_read" on public.league_settings
  for select using (true);

create policy "league_settings_admin_write" on public.league_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- standings / matchups: public read (or restrict to auth if preferred); admin write
create policy "standings_public_read" on public.standings
  for select using (true);

create policy "standings_admin_write" on public.standings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "matchups_public_read" on public.matchups
  for select using (true);

create policy "matchups_admin_write" on public.matchups
  for all using (public.is_admin()) with check (public.is_admin());

-- dues: authenticated read; admin write
create policy "dues_auth_read" on public.due_payments
  for select to authenticated using (true);

create policy "dues_admin_write" on public.due_payments
  for all using (public.is_admin()) with check (public.is_admin());

-- polls: authenticated read; admin manage; members vote via poll_votes
create policy "polls_auth_read" on public.polls
  for select to authenticated using (true);

create policy "polls_admin_write" on public.polls
  for all using (public.is_admin()) with check (public.is_admin());

create policy "poll_votes_auth_read" on public.poll_votes
  for select to authenticated using (true);

create policy "poll_votes_insert_own" on public.poll_votes
  for insert to authenticated
  with check (owner_id = public.current_owner_id());

create policy "poll_votes_update_own" on public.poll_votes
  for update to authenticated
  using (owner_id = public.current_owner_id())
  with check (owner_id = public.current_owner_id());

create policy "poll_votes_admin_all" on public.poll_votes
  for all using (public.is_admin()) with check (public.is_admin());

-- trash talk: authenticated read/insert own; admin delete
create policy "trash_auth_read" on public.trash_talk_posts
  for select to authenticated using (true);

create policy "trash_insert_own" on public.trash_talk_posts
  for insert to authenticated
  with check (owner_id = public.current_owner_id());

create policy "trash_admin_delete" on public.trash_talk_posts
  for delete using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Seed: 10 placeholder owners (optional — safe to re-run with ON CONFLICT skip)
-- -----------------------------------------------------------------------------
insert into public.owners (display_name, team_name, wins, losses, prize_money, badges, is_admin, draft_slot, sort_order)
select * from (values
  ('Len', 'Len', 0, 0, 0::numeric, array[]::text[], false, 1, 1),
  ('BIGBROWNSTAIN', 'BIGBROWNSTAIN', 0, 0, 0::numeric, array[]::text[], false, 2, 2),
  ('Big Lloyd', 'Big Lloyd', 0, 0, 0::numeric, array[]::text[], false, 3, 3),
  ('WhitsTits', 'WhitsTits', 0, 0, 0::numeric, array[]::text[], false, 4, 4),
  ('HAM BONE', 'HAM BONE', 0, 0, 0::numeric, array[]::text[], false, 5, 5),
  ('Playoff lock mase', 'Playoff lock mase', 0, 0, 0::numeric, array[]::text[], false, 6, 6),
  ('yo mama', 'yo mama', 0, 0, 0::numeric, array[]::text[], false, 7, 7),
  ('Lens daddy', 'Lens daddy', 0, 0, 0::numeric, array[]::text[], false, 8, 8),
  ('Starvin Marvin', 'Starvin Marvin', 0, 0, 0::numeric, array[]::text[], false, 9, 9),
  ('Benny Backshots', 'Benny Backshots', 0, 0, 0::numeric, array[]::text[], false, 10, 10)
) as v(display_name, team_name, wins, losses, prize_money, badges, is_admin, draft_slot, sort_order)
where not exists (select 1 from public.owners limit 1);
