-- Only the Edge Function's service role may write delivery receipts.
-- "Queued" means accepted by the provider, not confirmed inbox delivery.
begin;
create table if not exists public.submission_email_receipts (
  message_key text primary key,
  submission_id text not null,
  decision text not null check (decision in ('Accepted', 'Rejected')),
  provider_id text not null,
  requested_by uuid not null,
  created_at timestamptz not null default now()
);
alter table public.submission_email_receipts enable row level security;
revoke all on public.submission_email_receipts from anon, authenticated;
grant all on public.submission_email_receipts to service_role;
commit;
