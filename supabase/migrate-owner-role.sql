-- Optional league role label on owners (Commissioner, Co-Commissioner, etc.)
-- Run once in Supabase SQL Editor

alter table public.owners
  add column if not exists role text;

-- Seed roles for known admins (adjust names if needed)
update public.owners
set role = 'Commissioner'
where is_admin = true
  and (role is null or role = '');

comment on column public.owners.role is
  'Public role label e.g. Commissioner, Co-Commissioner, Owner';
