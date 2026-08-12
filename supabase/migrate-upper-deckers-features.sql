-- =============================================================================
-- Migration: draft_at column, admins (Len + yo mama), avatar storage
-- Run once in Supabase SQL Editor
-- =============================================================================

-- 1) Draft datetime for countdown (Sunday, Aug 30, 2026 3:45 PM EDT = 19:45 UTC)
alter table public.league_settings
  add column if not exists draft_at timestamptz;

update public.league_settings
set
  name = 'Upper Deckcers',
  tagline = 'Fantasy Football League',
  rules_summary = 'Draft: Sunday, August 30, 2026 · 3:45 PM EDT',
  draft_at = '2026-08-30T19:45:00+00:00',
  season_year = 2026,
  updated_at = now()
where id = 1;

-- 2) Full admins: Len + yo mama
update public.owners
set is_admin = true
where display_name in ('Len', 'yo mama');

-- Ensure everyone else stays non-admin (optional safety)
update public.owners
set is_admin = false
where display_name not in ('Len', 'yo mama');

-- 3) Public avatars bucket (for owner selfies)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: public read; authenticated admins write via app (service uses admin check in app)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_auth_upload" on storage.objects;
create policy "avatars_auth_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_auth_update" on storage.objects;
create policy "avatars_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_auth_delete" on storage.objects;
create policy "avatars_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');

-- Verify
select name, draft_at, rules_summary from public.league_settings where id = 1;
select display_name, is_admin from public.owners order by draft_slot;
