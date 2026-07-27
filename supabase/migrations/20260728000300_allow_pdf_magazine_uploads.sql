-- Store the original PDF for magazines uploaded from the admin dashboard.
-- Existing installations that already have this column are left unchanged.
alter table public.magazines
add column if not exists pdfurl text;

create or replace function public.can_manage_magazines()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
  );
$$;

revoke all on function public.can_manage_magazines() from public;
grant execute on function public.can_manage_magazines() to authenticated;

-- Allow staff to create and manage magazines, including the PDF URL saved by
-- the dashboard. Public read access remains limited to published magazines.
grant insert, update, delete on table public.magazines to authenticated;

drop policy if exists "Staff can manage magazines" on public.magazines;

create policy "Staff can manage magazines"
on public.magazines
for all
to authenticated
using (public.can_manage_magazines())
with check (public.can_manage_magazines());

-- The dashboard stores covers, page previews, and the original PDFs in this
-- public bucket. The policy permits uploads only from staff accounts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'magazines',
  'magazines',
  true,
  52428800,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff can upload magazine files" on storage.objects;

create policy "Staff can upload magazine files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'magazines'
  and public.can_manage_magazines()
);
