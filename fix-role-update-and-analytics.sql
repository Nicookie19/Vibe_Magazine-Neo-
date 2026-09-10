-- Create update_user_role function for admin role changes
create or replace function public.update_user_role(p_user_id uuid, p_new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only superadmins can change roles
  if not exists (
    select 1 from public.user_profiles
    where id = auth.uid()
    and role = 'superadmin'
    and is_active = true
  ) then
    raise exception 'Only superadmins can change roles';
  end if;

  -- Validate role
  if p_new_role not in ('admin', 'superadmin', 'faculty', 'student') then
    raise exception 'Invalid role';
  end if;

  -- Prevent superadmin from demoting themselves
  if p_user_id = auth.uid() and p_new_role != 'superadmin' then
    raise exception 'Cannot demote yourself';
  end if;

  -- Update role
  update public.user_profiles
  set role = p_new_role,
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

grant execute on function public.update_user_role(uuid, text) to authenticated;

-- Also create magazine_analytics table for analytics tracking
create table if not exists public.magazine_analytics (
    id uuid primary key default gen_random_uuid(),
    magazine_id uuid references public.magazines(id) on delete cascade,
    event_type text not null,
    user_id uuid references auth.users(id) on delete set null,
    metadata jsonb,
    created_at timestamptz default now()
);

alter table public.magazine_analytics enable row level security;

drop policy if exists "Anyone can insert analytics" on public.magazine_analytics;
create policy "Anyone can insert analytics"
    on public.magazine_analytics for insert to anon, authenticated with check (true);

drop policy if exists "Admins can read all analytics" on public.magazine_analytics;
create policy "Admins can read all analytics"
    on public.magazine_analytics for select to authenticated
    using (public.is_admin());

create index if not exists magazine_analytics_magazine_id_idx on public.magazine_analytics (magazine_id);
create index if not exists magazine_analytics_event_type_idx on public.magazine_analytics (event_type);
create index if not exists magazine_analytics_created_at_idx on public.magazine_analytics (created_at desc);