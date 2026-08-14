create type public.app_role as enum ('super_admin', 'agency_admin', 'maintenance', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Create a profile after adding each user in Supabase Authentication.
-- Example: insert into public.profiles (id, role) values ('AUTH_USER_UUID', 'staff');
