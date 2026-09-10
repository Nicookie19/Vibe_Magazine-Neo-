-- Create magazine_analytics table for tracking user interactions
create table if not exists public.magazine_analytics (
    id uuid primary key default gen_random_uuid(),
    magazine_id uuid references public.magazines(id) on delete cascade,
    event_type text not null, -- 'visit', 'like', 'comment', 'rating', 'save', 'share'
    user_id uuid references auth.users(id) on delete set null,
    metadata jsonb, -- e.g., {rating: 5, page: 3}
    created_at timestamptz default now()
);

-- Add user_id column if table exists but column is missing
alter table public.magazine_analytics
add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Enable RLS
alter table public.magazine_analytics enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Anyone can insert analytics" on public.magazine_analytics;
drop policy if exists "Admins can read all analytics" on public.magazine_analytics;
drop policy if exists "Users can read own analytics" on public.magazine_analytics;

-- Allow anyone to insert analytics events (for tracking)
create policy "Anyone can insert analytics"
    on public.magazine_analytics
    for insert
    to anon, authenticated
    with check (true);

-- Allow admins and superadmins to read all analytics
create policy "Admins can read all analytics"
    on public.magazine_analytics
    for select
    to authenticated
    using (
        exists (
            select 1 from public.user_profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- Allow users to read their own analytics
create policy "Users can read own analytics"
    on public.magazine_analytics
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Create index for better query performance
create index if not exists magazine_analytics_magazine_id_idx
    on public.magazine_analytics (magazine_id);

create index if not exists magazine_analytics_event_type_idx
    on public.magazine_analytics (event_type);

create index if not exists magazine_analytics_created_at_idx
    on public.magazine_analytics (created_at desc);