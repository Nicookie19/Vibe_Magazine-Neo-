-- Add extra fields to magazine_comments for anonymous commenting
alter table public.magazine_comments
add column if not exists id_number text,
add column if not exists email text,
add column if not exists course text,
add column if not exists year text;