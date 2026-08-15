-- Public storage bucket backing the request_photos table. Uploads happen
-- server-side via the service-role client (app/actions/photos.ts), so no
-- storage RLS policies are required; the bucket's `public` flag lets the
-- stored public URLs be viewed directly without auth.
insert into storage.buckets (id, name, public)
values ('request-photos', 'request-photos', true)
on conflict (id) do nothing;
