create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  trade text,
  contact_name text,
  phone text,
  email text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contractors_status_check check (status = any (array['active','inactive']))
);

create table public.request_contractor_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id),
  status text not null default 'awaiting',
  sent_at timestamptz not null default now(),
  appointment_at timestamptz,
  quote_amount numeric(10,2),
  invoice_status text not null default 'pending',
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_contractor_assignments_status_check
    check (status = any (array['awaiting','scheduled','completed','cancelled'])),
  constraint request_contractor_assignments_invoice_check
    check (invoice_status = any (array['pending','received','paid']))
);

comment on table public.contractors is
  'Agency-scoped vendor directory (HVAC, plumber, electrician, etc.), managed by super_admin/agency_admin.';
comment on table public.request_contractor_assignments is
  'History of contractor assignments on a request. Deliberately not exclusive/unique per request — a new row is a reassignment; the most recent row is the current one. Kept separate from requests.status so the existing status pipeline is untouched.';
