-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Allow users to read their own profile
drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
    on public.user_profiles
    for select
    to authenticated
    using (auth.uid() = id);

-- Allow users to insert their own profile (for first login)
drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
    on public.user_profiles
    for insert
    to authenticated
    with check (auth.uid() = id);

-- Allow admins to read all profiles
drop policy if exists "Admins can read all profiles" on public.user_profiles;
create policy "Admins can read all profiles"
    on public.user_profiles
    for select
    to authenticated
    using (
        exists (
            select 1 from public.user_profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );