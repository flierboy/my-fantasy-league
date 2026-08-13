-- =============================================================================
-- Email notifications support
-- Run in Supabase SQL Editor after schema.sql
-- =============================================================================

-- Future-proof: owners can opt out of league emails
alter table public.owners
  add column if not exists email_opt_out boolean not null default false;

comment on column public.owners.email_opt_out is
  'When true, owner is excluded from poll/announcement/weekly emails.';

-- Announcements (commissioner posts; optional email blast)
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null check (char_length(body) between 1 and 5000),
  created_by uuid references public.owners (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists announcements_created_idx
  on public.announcements (created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements_auth_read" on public.announcements;
create policy "announcements_auth_read" on public.announcements
  for select to authenticated
  using (true);

drop policy if exists "announcements_admin_write" on public.announcements;
create policy "announcements_admin_write" on public.announcements
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
