-- =============================================================================
-- Wall of the Dead — departed owners (epitaphs)
-- Safe to re-run in Supabase SQL Editor
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- ---------------------------------------------------------------------------
-- departed_owners: owners who left the league
-- ---------------------------------------------------------------------------
create table if not exists public.departed_owners (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  departed_year int not null check (departed_year >= 1990 and departed_year <= 2100),
  epitaph text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departed_owners_year_idx
  on public.departed_owners (departed_year desc, sort_order);

alter table public.departed_owners enable row level security;

drop policy if exists "departed_owners_public_read" on public.departed_owners;
create policy "departed_owners_public_read" on public.departed_owners
  for select using (true);

drop policy if exists "departed_owners_admin_all" on public.departed_owners;
create policy "departed_owners_admin_all" on public.departed_owners
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists departed_owners_updated_at on public.departed_owners;
create trigger departed_owners_updated_at
  before update on public.departed_owners
  for each row execute function public.set_updated_at();

-- No seed rows — leave empty unless you add real departed owners in Admin.
-- Empty public state: "Nobody's died. Yet."

-- Verify
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name = 'departed_owners';
