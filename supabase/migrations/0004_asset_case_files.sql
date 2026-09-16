alter table public.requests
  add column cost numeric(10,2),
  add column resolution_notes text,
  add column completed_at timestamptz;

comment on column public.requests.cost is
  'Repair cost captured on completion, for asset case-file cost totals.';
comment on column public.requests.resolution_notes is
  'What fixed it, captured on completion.';
comment on column public.requests.completed_at is
  'Set the first time status becomes Completed; used for downtime/case-file stats.';
