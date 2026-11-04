-- The reader uses a browser-generated text user_id, including for signed-out
-- visitors. auth.uid() ownership policies therefore cannot authorize its inserts.
-- Keep RLS enabled and permit only valid ratings for published magazines.
begin;

alter table public.magazine_ratings enable row level security;

grant select on table public.magazine_ratings to anon, authenticated;
grant insert (magazine_id, user_id, rating)
on table public.magazine_ratings to anon, authenticated;

-- Some installations use serial/identity IDs instead of UUID defaults.
do $$
declare
  rating_sequence text;
begin
  rating_sequence := pg_get_serial_sequence('public.magazine_ratings', 'id');
  if rating_sequence is not null then
    execute format('grant usage on sequence %s to anon, authenticated', rating_sequence);
  end if;
end;
$$;

drop policy if exists "Readers can view published magazine ratings"
on public.magazine_ratings;
create policy "Readers can view published magazine ratings"
on public.magazine_ratings
for select
to anon, authenticated
using (
  exists (
    select 1 from public.magazines
    where magazines.id = magazine_ratings.magazine_id
      and magazines.published is true
  )
);

drop policy if exists "Readers can rate published magazines"
on public.magazine_ratings;
create policy "Readers can rate published magazines"
on public.magazine_ratings
for insert
to anon, authenticated
with check (
  rating between 1 and 5
  and user_id is not null
  and length(btrim(user_id::text)) between 1 and 200
  and exists (
    select 1 from public.magazines
    where magazines.id = magazine_ratings.magazine_id
      and magazines.published is true
  )
);

commit;
