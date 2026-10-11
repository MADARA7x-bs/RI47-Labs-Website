-- RI 47 Labs schema. Run in Supabase Dashboard -> SQL Editor.
-- Replace ADMIN_EMAIL below with the exact email you will use for the admin account.
-- Keep Row Level Security enabled. Never use a service-role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  platform text not null default 'Android',
  category text,
  version text,
  release_date date,
  icon_url text,
  project_url text,
  download_url text not null,
  changelog text,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.admin_users enable row level security;

-- Anyone can read only published projects.
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
on public.projects for select
using (published = true);

-- Admins can read all project records.
drop policy if exists "Admins can read all projects" on public.projects;
create policy "Admins can read all projects"
on public.projects for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
on public.projects for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
on public.projects for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
on public.projects for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Users may check whether their own account is an admin; nobody can grant themselves access.
drop policy if exists "Users can read own admin record" on public.admin_users;
create policy "Users can read own admin record"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

-- IMPORTANT: After creating your first Auth user in Supabase Dashboard,
-- add that user's UUID to admin_users using SQL Editor:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
-- Do not expose a service-role key in config.js.
