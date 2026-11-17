-- TIC360 production security hardening
-- Run once in Supabase SQL Editor after taking a database backup.
-- This migration is non-destructive: it changes functions, grants, and RLS policies only.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Some older TIC360 deployments predate this table. Create it before applying
-- grants and policies so the hardening migration remains safe to rerun.
create table if not exists public.programme_history (
  id uuid primary key default gen_random_uuid(),
  student_id varchar(100) not null references public.students(id) on delete cascade,
  programme text not null,
  group_name text,
  effective_from date not null,
  created_at timestamptz default now()
);

create index if not exists idx_programme_history_student_id
  on public.programme_history(student_id);
create index if not exists idx_programme_history_effective_from
  on public.programme_history(effective_from);

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then null
    else (select p.role from public.user_profiles p where p.id = (select auth.uid()))
  end
$$;

create or replace function private.current_student_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then null
    else (select p.student_id from public.user_profiles p where p.id = (select auth.uid()))
  end
$$;

revoke all on function private.current_user_role() from public, anon;
revoke all on function private.current_student_id() from public, anon;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_student_id() to authenticated;

-- Never trust user-editable raw_user_meta_data for authorization.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_student_id text;
begin
  select s.id into linked_student_id
  from public.students s
  where lower(s.email) = lower(new.email)
    and s.id = new.raw_user_meta_data->>'student_id'
  limit 1;

  insert into public.user_profiles (
    id, email, full_name, role, department, ut_number, student_id, avatar_url
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'Student',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'ut_number',
    linked_student_id,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    department = coalesce(excluded.department, public.user_profiles.department),
    ut_number = coalesce(excluded.ut_number, public.user_profiles.ut_number),
    student_id = coalesce(public.user_profiles.student_id, excluded.student_id),
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Remove every legacy permissive policy from application tables.
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'courses','batches','students','student_bank_details','blossom_applications',
    'attendance','attendance_sessions','attendance_marks','blossom_payments','dropouts',
    'assessments','assessment_marks','course_completions','student_outcomes','audit_logs',
    'system_settings','user_profiles','absence_requests','career_survey_responses','programme_history'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      for policy_name in
        select pol.polname
        from pg_policy pol
        join pg_class cls on cls.oid = pol.polrelid
        join pg_namespace nsp on nsp.oid = cls.relnamespace
        where nsp.nspname = 'public' and cls.relname = table_name
      loop
        execute format('drop policy %I on public.%I', policy_name, table_name);
      end loop;
      execute format('revoke all on public.%I from anon, authenticated', table_name);
    end if;
  end loop;
end $$;

-- Reference data
grant select on public.courses, public.batches to authenticated;
grant insert, update, delete on public.courses, public.batches to authenticated;
create policy courses_read on public.courses for select to authenticated using (true);
create policy courses_staff_write on public.courses for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Data Entry Officer'));
create policy batches_read on public.batches for select to authenticated using (true);
create policy batches_staff_write on public.batches for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Data Entry Officer'));

-- Student directory. Anonymous registration can only insert and cannot read rows back.
grant insert on public.students, public.student_bank_details, public.blossom_applications to anon;
grant select, insert, update, delete on public.students to authenticated;
create policy students_public_register on public.students for insert to anon with check (true);
create policy students_read on public.students for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or id = (select private.current_student_id()));
create policy students_staff_insert on public.students for insert to authenticated
  with check ((select private.current_user_role()) in ('Admin','Data Entry Officer'));
create policy students_update on public.students for update to authenticated
  using ((select private.current_user_role()) in ('Admin','Data Entry Officer') or id = (select private.current_student_id()))
  with check ((select private.current_user_role()) in ('Admin','Data Entry Officer') or id = (select private.current_student_id()));
create policy students_admin_delete on public.students for delete to authenticated
  using ((select private.current_user_role()) = 'Admin');

grant select, insert, update, delete on public.student_bank_details, public.blossom_applications to authenticated;
create policy bank_public_register on public.student_bank_details for insert to anon with check (true);
create policy bank_read on public.student_bank_details for select to authenticated
  using ((select private.current_user_role()) in ('Admin','Blossom Trust Officer','Data Entry Officer') or student_id = (select private.current_student_id()));
create policy bank_write on public.student_bank_details for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Blossom Trust Officer','Data Entry Officer') or student_id = (select private.current_student_id()))
  with check ((select private.current_user_role()) in ('Admin','Blossom Trust Officer','Data Entry Officer') or student_id = (select private.current_student_id()));
create policy application_public_register on public.blossom_applications for insert to anon with check (true);
create policy application_read on public.blossom_applications for select to authenticated
  using ((select private.current_user_role()) in ('Admin','Blossom Trust Officer','Data Entry Officer') or student_id = (select private.current_student_id()));
create policy application_write on public.blossom_applications for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Blossom Trust Officer','Data Entry Officer') or student_id = (select private.current_student_id()))
  with check ((select private.current_user_role()) in ('Admin','Blossom Trust Officer','Data Entry Officer') or student_id = (select private.current_student_id()));

-- Academic data
grant select on public.attendance, public.attendance_sessions, public.attendance_marks,
  public.assessments, public.assessment_marks, public.course_completions, public.student_outcomes to authenticated;
grant insert, update, delete on public.attendance, public.attendance_sessions, public.attendance_marks,
  public.assessments, public.assessment_marks, public.course_completions, public.student_outcomes to authenticated;
create policy attendance_read on public.attendance for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy attendance_staff_write on public.attendance for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'));
create policy sessions_read on public.attendance_sessions for select to authenticated using (true);
create policy sessions_staff_write on public.attendance_sessions for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'));
create policy marks_read on public.attendance_marks for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy marks_staff_write on public.attendance_marks for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'));
create policy assessments_read on public.assessments for select to authenticated using (true);
create policy assessments_staff_write on public.assessments for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer'));
create policy assessment_marks_read on public.assessment_marks for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy assessment_marks_staff_write on public.assessment_marks for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer'));
create policy completions_read on public.course_completions for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy completions_staff_write on public.course_completions for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer'));
create policy outcomes_read on public.student_outcomes for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy outcomes_staff_write on public.student_outcomes for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'));

-- Financial and dropout data
grant select, insert, update, delete on public.blossom_payments, public.dropouts to authenticated;
create policy payments_read on public.blossom_payments for select to authenticated
  using ((select private.current_user_role()) in ('Admin','Blossom Trust Officer') or student_id = (select private.current_student_id()));
create policy payments_staff_write on public.blossom_payments for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Blossom Trust Officer'))
  with check ((select private.current_user_role()) in ('Admin','Blossom Trust Officer'));
create policy dropouts_read on public.dropouts for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy dropouts_staff_write on public.dropouts for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer','Blossom Trust Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer','Blossom Trust Officer'));

-- Profiles and system data
grant select on public.user_profiles to authenticated;
grant update on public.user_profiles to authenticated;
create policy profiles_read on public.user_profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.current_user_role()) = 'Admin');
create policy profiles_admin_update on public.user_profiles for update to authenticated
  using ((select private.current_user_role()) = 'Admin')
  with check ((select private.current_user_role()) = 'Admin');
grant select on public.system_settings to authenticated;
grant insert, update, delete on public.system_settings to authenticated;
create policy settings_read on public.system_settings for select to authenticated using (true);
create policy settings_admin_write on public.system_settings for all to authenticated
  using ((select private.current_user_role()) = 'Admin')
  with check ((select private.current_user_role()) = 'Admin');
grant select, insert on public.audit_logs to authenticated;
create policy audit_admin_read on public.audit_logs for select to authenticated
  using ((select private.current_user_role()) = 'Admin');
create policy audit_staff_insert on public.audit_logs for insert to authenticated
  with check ((select private.current_user_role()) <> 'Student');

-- Public forms: anonymous users may submit but never list, update, or delete submissions.
grant insert on public.absence_requests, public.career_survey_responses to anon;
grant select, insert, update on public.absence_requests, public.career_survey_responses to authenticated;
create policy absence_public_submit on public.absence_requests for insert to anon with check (true);
create policy absence_read on public.absence_requests for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy absence_staff_manage on public.absence_requests for update to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'));
create policy career_public_submit on public.career_survey_responses for insert to anon with check (true);
create policy career_staff_read on public.career_survey_responses for select to authenticated
  using ((select private.current_user_role()) <> 'Student');
create policy career_staff_manage on public.career_survey_responses for update to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'));

grant select, insert, update, delete on public.programme_history to authenticated;
create policy history_read on public.programme_history for select to authenticated
  using ((select private.current_user_role()) <> 'Student' or student_id = (select private.current_student_id()));
create policy history_staff_write on public.programme_history for all to authenticated
  using ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'))
  with check ((select private.current_user_role()) in ('Admin','Trainer','Data Entry Officer'));

commit;

-- After this migration, assign staff roles only from the SQL Editor or trusted server:
-- update public.user_profiles set role = 'Admin' where email = 'admin@unicomtic.lk';
-- Allowed roles: Admin, Blossom Trust Officer, Trainer, Data Entry Officer, Student.
