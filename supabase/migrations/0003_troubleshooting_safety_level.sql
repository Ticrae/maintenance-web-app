alter table public.troubleshooting_steps
  add column safety_level text not null default 'safe';

alter table public.troubleshooting_steps
  add constraint troubleshooting_steps_safety_level_check
  check (safety_level = any (array['safe', 'caution', 'maintenance_required']));

comment on column public.troubleshooting_steps.safety_level is
  'safe = resident/staff can perform. caution = basic check only. maintenance_required = do not instruct resident/staff to perform.';
