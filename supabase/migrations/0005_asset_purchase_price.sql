alter table public.assets
  add column purchase_price numeric(10,2);

comment on column public.assets.purchase_price is
  'What the asset cost when bought, for repair-vs-replace cost comparisons.';
