-- =============================================================================
-- History entries — admin-editable league history
-- Run once in Supabase SQL Editor
-- Column name: record_type (champion | milestone | record | note)
-- =============================================================================

create table if not exists public.history_entries (
  id uuid primary key default gen_random_uuid(),
  -- champion | milestone | record | note
  record_type text not null
    check (record_type in ('champion', 'milestone', 'record', 'note')),
  -- Display year / season label (e.g. "2024", "2025 playoffs")
  year_label text not null,
  -- Optional numeric season for sorting champions
  season_year int,
  title text not null default '',
  champion text,
  runner_up text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If an older install used entry_type, rename it
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'history_entries'
      and column_name = 'entry_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'history_entries'
      and column_name = 'record_type'
  ) then
    alter table public.history_entries rename column entry_type to record_type;
  end if;
end $$;

create index if not exists history_entries_type_idx
  on public.history_entries (record_type, sort_order, season_year desc nulls last);

alter table public.history_entries enable row level security;

drop policy if exists "history_public_read" on public.history_entries;
create policy "history_public_read" on public.history_entries
  for select using (true);

drop policy if exists "history_admin_all" on public.history_entries;
create policy "history_admin_all" on public.history_entries
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists history_entries_updated_at on public.history_entries;
create trigger history_entries_updated_at
  before update on public.history_entries
  for each row execute function public.set_updated_at();

-- Optional starter row (safe to keep or delete)
insert into public.history_entries (
  record_type, year_label, season_year, title, champion, runner_up, notes, sort_order
)
select
  'note',
  '2026',
  2026,
  'Inaugural season',
  null,
  null,
  'Upper Deckcers season 1 — history will fill in as the years go by.',
  0
where not exists (select 1 from public.history_entries limit 1);
