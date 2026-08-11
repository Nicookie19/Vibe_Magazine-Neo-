-- Fix RLS for magazine_comments to allow anonymous commenting
-- Drop existing restrictive policies
drop policy if exists "Users can insert own comments" on public.magazine_comments;
drop policy if exists "Users can update own comments" on public.magazine_comments;
drop policy if exists "Users can delete own comments" on public.magazine_comments;
drop policy if exists "Admins can manage all comments" on public.magazine_comments;

-- Allow anyone to insert comments (no auth required)
grant insert on table public.magazine_comments to anon, authenticated;

create policy "Anyone can insert comments"
on public.magazine_comments
for insert
to anon, authenticated
with check (true);

-- Allow anyone to read comments
grant select on table public.magazine_comments to anon, authenticated;

drop policy if exists "Public can view magazine comments" on public.magazine_comments;

create policy "Public can view magazine comments"
on public.magazine_comments
for select
to anon, authenticated
using (true);

-- Allow admins to delete any comment (for moderation)
create or replace function public.can_manage_magazine_comments()
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

revoke all on function public.can_manage_magazine_comments() from public;
grant execute on function public.can_manage_magazine_comments() to authenticated;

grant delete on table public.magazine_comments to authenticated;

drop policy if exists "Admins can manage all comments" on public.magazine_comments;

create policy "Admins can manage all comments"
on public.magazine_comments
for delete
to authenticated
using (public.can_manage_magazine_comments());

-- Add extra fields to magazine_comments for anonymous commenting
alter table public.magazine_comments
add column if not exists id_number text,
add column if not exists email text,
add column if not exists course text,
add column if not exists year text;