create table public.app_settings (
  id boolean primary key default true,
  categories text[] not null default array['Plumbing','Electrical','HVAC','Appliance','Structural','Pest control','Other'],
  sla_hours jsonb not null default '{"Urgent":4,"High":24,"Medium":48,"Low":72}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton_id check (id)
);

insert into public.app_settings (id) values (true);

alter table public.app_settings enable row level security;

create policy "Authenticated users can read settings"
  on public.app_settings for select
  to authenticated
  using (true);

-- No update/insert/delete policy: writes only happen server-side via the
-- service-role client inside updateSettings(), after requireSuperAdmin()
-- has verified the caller is a super_admin.
