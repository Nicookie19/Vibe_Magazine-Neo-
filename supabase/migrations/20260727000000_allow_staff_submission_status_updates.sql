-- Allow authenticated staff members to review submissions. This fixes the
-- PostgREST/RLS case where an UPDATE returns no error but affects zero rows.
-- The function reads profiles as the migration owner, so its result is not
-- dependent on the caller having direct access to every user profile.
create or replace function public.can_review_submissions()
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

revoke all on function public.can_review_submissions() from public;
grant execute on function public.can_review_submissions() to authenticated;

grant update (status) on table public.submissions to authenticated;

drop policy if exists "Staff can update submission status" on public.submissions;

create policy "Staff can update submission status"
on public.submissions
for update
to authenticated
using (public.can_review_submissions())
with check (public.can_review_submissions());

-- Repair submissions that were already published while their status update was
-- blocked by RLS. Matching both title and author keeps this limited to the
-- related magazine cards.
update public.submissions as submission
set status = 'Accepted'
where coalesce(submission.status, 'Pending') = 'Pending'
  and exists (
    select 1
    from public.magazines as magazine
    where magazine.title = submission.title_of_work
      and magazine.subtitle = concat('By ', submission.full_name)
      and magazine.published is true
  );
