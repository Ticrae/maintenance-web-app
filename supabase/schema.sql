-- Snapshot of the live schema, for reference only (not applied by any tooling).
-- Keep in sync by hand when the live Supabase project's schema changes.

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  role text not null default 'staff',
  agency_id uuid references public.agencies(id),
  home_id uuid references public.homes(id),
  created_at timestamptz default now(),
  constraint profiles_role_check check (
    role = any (array['super_admin','agency_admin','maintenance','staff'])
  )
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  category text,
  location text,
  name text,
  created_at timestamptz default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  reported_by uuid not null,
  assigned_to uuid,
  category text not null,
  priority text not null,
  status text not null default 'Open',
  description text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint requests_priority_check check (
    priority = any (array['Low','Medium','High','Urgent'])
  ),
  constraint requests_status_check check (
    status = any (array['Open','Assigned','In Progress','Waiting for Parts','Completed','Cancelled'])
  )
);

create trigger update_requests_updated_at
  before update on public.requests
  for each row execute function update_updated_at_column();

create table public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null,
  message text not null,
  created_at timestamptz default now()
);

create table public.request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

-- See migrations/0001_app_settings.sql and migrations/0002_request_photos_bucket.sql
-- for the app_settings table and the request-photos storage bucket.
