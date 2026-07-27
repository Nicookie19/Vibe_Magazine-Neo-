-- Permit authenticated admins and superadmins to create, edit, and remove
-- events while keeping public event visibility controlled by existing policies.
create or replace function public.can_manage_events()
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

revoke all on function public.can_manage_events() from public;
grant execute on function public.can_manage_events() to authenticated;

grant insert, update, delete on table public.events to authenticated;

drop policy if exists "Staff can manage events" on public.events;

create policy "Staff can manage events"
on public.events
for all
to authenticated
using (public.can_manage_events())
with check (public.can_manage_events());
