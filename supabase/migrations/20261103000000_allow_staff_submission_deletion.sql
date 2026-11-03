-- Permit active staff to delete submissions regardless of review status.
-- Published magazine records and uploaded files are not deleted by this policy.
begin;

create or replace function public.can_delete_submissions()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
      and is_active is true
  );
$$;

revoke all on function public.can_delete_submissions() from public;
grant execute on function public.can_delete_submissions() to authenticated;

grant delete on table public.submissions to authenticated;

drop policy if exists "Active staff can delete submissions" on public.submissions;
create policy "Active staff can delete submissions"
on public.submissions
for delete
to authenticated
using (public.can_delete_submissions());

commit;
