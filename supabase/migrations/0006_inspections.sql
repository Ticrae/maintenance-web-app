create table public.inspection_templates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inspection_templates_status_check check (status = any (array['draft','published','archived']))
);

create table public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.inspection_templates(id) on delete cascade,
  section text,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.inspection_runs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.inspection_templates(id),
  agency_id uuid not null references public.agencies(id),
  home_id uuid not null references public.homes(id) on delete cascade,
  performed_by uuid not null references public.profiles(id),
  status text not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint inspection_runs_status_check check (status = any (array['in_progress','completed']))
);

create table public.inspection_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.inspection_runs(id) on delete cascade,
  item_id uuid not null references public.inspection_items(id) on delete cascade,
  passed boolean not null,
  notes text,
  request_id uuid references public.requests(id) on delete set null,
  created_at timestamptz not null default now(),
  -- One result per item per run; server actions upsert on this pair so an
  -- item can be re-marked (e.g. Fail corrected to Pass) without duplicating.
  constraint inspection_results_run_item_unique unique (run_id, item_id)
);

comment on table public.inspection_templates is
  'Author-managed checklists (e.g. "Monthly Home Inspection"), super_admin only.';
comment on table public.inspection_runs is
  'One walkthrough of a template at a specific home, performed by staff/maintenance/agency_admin.';
comment on column public.inspection_results.request_id is
  'Set when a failed item was used to create a maintenance request.';
