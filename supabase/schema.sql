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

create table public.asset_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id),
  home_id uuid not null references public.homes(id) on delete cascade,
  asset_type_id uuid not null references public.asset_types(id),
  name text not null,
  manufacturer text,
  model text,
  serial_number text,
  location text,
  status text not null default 'active',
  purchase_date date,
  warranty_expiry date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_status_check check (
    status = any (array['active', 'out_of_service', 'retired'])
  )
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

create table public.troubleshooting_guides (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id),
  asset_type_id uuid not null references public.asset_types(id),
  created_by uuid not null references public.profiles(id),
  problem text not null,
  title text not null,
  description text,
  status text not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint troubleshooting_guides_status_check check (
    status = any (array['draft', 'review', 'published', 'archived'])
  ),
  constraint troubleshooting_guides_version_check check (version > 0)
);

create table public.troubleshooting_steps (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.troubleshooting_guides(id),
  step_number integer not null,
  title text not null,
  instruction text not null,
  question text,
  step_type text not null default 'question',
  -- safe = resident/staff can perform. caution = basic check only.
  -- maintenance_required = do not instruct resident/staff to perform.
  safety_level text not null default 'safe',
  created_at timestamptz not null default now(),
  constraint troubleshooting_steps_step_number_check check (step_number > 0),
  constraint troubleshooting_steps_step_type_check check (
    step_type = any (array['instruction', 'question', 'information'])
  ),
  constraint troubleshooting_steps_safety_level_check check (
    safety_level = any (array['safe', 'caution', 'maintenance_required'])
  )
);

create table public.troubleshooting_options (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.troubleshooting_steps(id),
  label text not null,
  next_step_id uuid references public.troubleshooting_steps(id),
  action text,
  constraint troubleshooting_options_action_check check (
    action is null or action = any (array['continue', 'create_request', 'finish', 'stop'])
  )
);

-- See migrations/0001_app_settings.sql, migrations/0002_request_photos_bucket.sql
-- and migrations/0003_troubleshooting_safety_level.sql for the app_settings
-- table, the request-photos storage bucket, and troubleshooting_steps.safety_level.
