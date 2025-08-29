-- Supabase Storage buckets and policies

-- Buckets
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('assignments-resources', 'assignments-resources', false),
  ('student-submissions', 'student-submissions', false),
  ('live-resources', 'live-resources', false)
on conflict (id) do nothing;

-- Policies for avatars: public read, user owns files under their own folder `${auth.uid()}/...`
create policy if not exists avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy if not exists avatars_owner_insert on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid() is not null and name like auth.uid()::text || '/%'
  );

create policy if not exists avatars_owner_update on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid() is not null and name like auth.uid()::text || '/%'
  );

create policy if not exists avatars_owner_delete on storage.objects
  for delete using (
    bucket_id = 'avatars' and auth.uid() is not null and name like auth.uid()::text || '/%'
  );

-- Other buckets remain private; use service role signed URLs via backend

