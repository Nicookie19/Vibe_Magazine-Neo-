-- Events are displayed on the public home page, so visitors must be able to
-- read them even when they are not signed in.
grant select on table public.events to anon, authenticated;

drop policy if exists "Public can view events" on public.events;

create policy "Public can view events"
on public.events
for select
to anon, authenticated
using (true);
