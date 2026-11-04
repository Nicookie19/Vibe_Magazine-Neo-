begin;

create or replace function public.is_uic_email(value text)
returns boolean language sql immutable set search_path = ''
as $$ select coalesce(btrim(value) ~* '^[^[:space:]@]+@uic\.edu\.ph$', false); $$;

-- Apply to new accounts and changed email addresses; existing accounts remain.
create or replace function public.enforce_uic_email()
returns trigger language plpgsql set search_path = ''
as $$
declare
  email_field text := tg_argv[0];
  new_email text := to_jsonb(new)->>email_field;
begin
  if tg_op = 'INSERT' or new_email is distinct from (to_jsonb(old)->>email_field) then
    if (new_email is not null or tg_argv[1] = 'required') and not public.is_uic_email(new_email) then
      raise exception 'Please use an email address ending in @uic.edu.ph.' using errcode = '23514';
    end if;
    new := jsonb_populate_record(new, jsonb_build_object(email_field, lower(btrim(new_email))));
  end if;
  return new;
end;
$$;

drop trigger if exists require_uic_auth_email on auth.users;
create trigger require_uic_auth_email before insert or update of email on auth.users
for each row execute function public.enforce_uic_email('email', 'required');
drop trigger if exists require_uic_submission_email on public.submissions;
create trigger require_uic_submission_email before insert or update of student_email on public.submissions
for each row execute function public.enforce_uic_email('student_email', 'required');
drop trigger if exists require_uic_feedback_email on public.feedback;
create trigger require_uic_feedback_email before insert or update of email on public.feedback
for each row execute function public.enforce_uic_email('email', 'required');
drop trigger if exists require_uic_comment_email on public.magazine_comments;
create trigger require_uic_comment_email before insert or update of email on public.magazine_comments
for each row execute function public.enforce_uic_email('email', 'optional');
drop trigger if exists require_uic_profile_email on public.user_profiles;
create trigger require_uic_profile_email before insert or update of email on public.user_profiles
for each row execute function public.enforce_uic_email('email', 'required');

alter table public.submissions add column if not exists rejection_remarks text;
grant update (status, rejection_remarks) on public.submissions to authenticated;

create or replace function public.is_active_editor()
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.user_profiles where id = auth.uid()
 and role in ('admin', 'superadmin') and is_active is true);
$$;
revoke all on function public.is_active_editor() from public;
grant execute on function public.is_active_editor() to authenticated, anon;

create or replace function public.enforce_submission_review()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.submitted_at := now();
    if coalesce(new.status, 'Pending') <> 'Pending' or new.rejection_remarks is not null then
      raise exception 'New submissions must start pending without reviewer remarks.';
    end if;
  else
    if new.submitted_at is distinct from old.submitted_at then
      raise exception 'The original submission date cannot be changed.';
    end if;
    if new.status is distinct from old.status or new.rejection_remarks is distinct from old.rejection_remarks then
      if not public.is_active_editor() then
        raise exception 'Only active admins and superadmins may review submissions.' using errcode = '42501';
      end if;
      if new.status = 'Rejected' and coalesce(length(btrim(new.rejection_remarks)), 0) = 0 then
        raise exception 'Please provide rejection remarks.';
      end if;
      if length(new.rejection_remarks) > 3000 then
        raise exception 'Rejection remarks must be at most 3000 characters.';
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_submission_review on public.submissions;
create trigger enforce_submission_review before insert or update on public.submissions
for each row execute function public.enforce_submission_review();

create or replace function public.censor_comment(value text)
returns text language sql immutable set search_path = ''
as $$
 select regexp_replace(value,
 '\m(fuck(ing|er|ed|s)?|f[u*]ck|sh[i1*]t|bullshit|bitch(es)?|asshole(s)?|putang[[:space:]-]*ina|tangina|gago|gaga|pakyu|ulol)\M',
 '[censored]', 'gi');
$$;

-- Both comment schemas are in use: legacy text and newer comment_text.
create or replace function public.filter_comment_language()
returns trigger language plpgsql set search_path = ''
as $$
declare payload jsonb := to_jsonb(new);
begin
  if payload ? 'text' then
    payload := jsonb_set(payload, '{text}', coalesce(to_jsonb(public.censor_comment(payload->>'text')), 'null'::jsonb));
  end if;
  if payload ? 'comment_text' then
    payload := jsonb_set(payload, '{comment_text}', coalesce(to_jsonb(public.censor_comment(payload->>'comment_text')), 'null'::jsonb));
  end if;
  new := jsonb_populate_record(new, payload);
  return new;
end;
$$;
drop trigger if exists filter_comment_language on public.magazine_comments;
create trigger filter_comment_language before insert or update on public.magazine_comments
for each row execute function public.filter_comment_language();

commit;
