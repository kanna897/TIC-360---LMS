begin;

create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  email extensions.citext not null unique,
  full_name text not null,
  role text not null default 'Student'
    constraint profiles_role_check check (role in ('Admin', 'Trainer', 'Student')),
  account_status text not null default 'Active'
    constraint profiles_account_status_check check (account_status in ('Active', 'Inactive', 'Suspended')),
  phone text,
  avatar_url text,
  must_change_password boolean not null default true,
  temporary_password_expires_at timestamptz,
  first_login_completed_at timestamptz,
  last_password_change_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id bigint generated always as identity primary key,
  code extensions.citext not null unique,
  name text not null,
  description text,
  duration_months smallint not null default 9
    constraint courses_duration_check check (duration_months > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.batches (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses(id) on delete restrict,
  name text not null,
  academic_year smallint not null,
  start_date date not null,
  end_date date,
  status text not null default 'Upcoming'
    constraint batches_status_check check (status in ('Upcoming', 'Active', 'Completed', 'Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint batches_date_check check (end_date is null or end_date >= start_date),
  constraint batches_course_name_unique unique (course_id, name)
);

create table public.groups (
  id bigint generated always as identity primary key,
  batch_id bigint not null references public.batches(id) on delete cascade,
  name text not null constraint groups_name_check check (name in ('Group A', 'Group B')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint groups_batch_name_unique unique (batch_id, name)
);

create table public.students (
  id bigint generated always as identity primary key,
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  ut_number extensions.citext not null unique,
  contact_number text,
  enrollment_date date not null default current_date,
  account_status text not null default 'Active'
    constraint students_account_status_check check (account_status in ('Active', 'Inactive', 'Completed', 'Dropout', 'Suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trainers (
  id bigint generated always as identity primary key,
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  employee_number extensions.citext unique,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_enrollments (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students(id) on delete restrict,
  course_id bigint not null references public.courses(id) on delete restrict,
  batch_id bigint not null references public.batches(id) on delete restrict,
  group_id bigint not null references public.groups(id) on delete restrict,
  status text not null default 'Active'
    constraint student_enrollments_status_check check (status in ('Active', 'Completed', 'Withdrawn', 'Transferred')),
  enrolled_at date not null default current_date,
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_enrollments_one_active unique nulls not distinct (student_id, completed_at)
);

create table public.subjects (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses(id) on delete restrict,
  code extensions.citext not null,
  name text not null,
  description text,
  stage smallint not null constraint subjects_stage_check check (stage between 1 and 3),
  is_common boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_course_code_unique unique (course_id, code)
);

create table public.modules (
  id bigint generated always as identity primary key,
  subject_id bigint not null references public.subjects(id) on delete cascade,
  title text not null,
  description text,
  sort_order smallint not null default 0 constraint modules_sort_order_check check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modules_subject_title_unique unique (subject_id, title)
);

create table public.trainer_assignments (
  id bigint generated always as identity primary key,
  trainer_id bigint not null references public.trainers(id) on delete cascade,
  subject_id bigint not null references public.subjects(id) on delete cascade,
  batch_id bigint not null references public.batches(id) on delete cascade,
  group_id bigint references public.groups(id) on delete cascade,
  starts_on date not null default current_date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint trainer_assignments_dates_check check (ends_on is null or ends_on >= starts_on),
  constraint trainer_assignments_scope_unique unique nulls not distinct
    (trainer_id, subject_id, batch_id, group_id, ends_on)
);

create table public.specialisation_options (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses(id) on delete cascade,
  code extensions.citext not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint specialisation_options_course_code_unique unique (course_id, code)
);

create table public.student_specialisations (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students(id) on delete cascade,
  specialisation_id bigint not null references public.specialisation_options(id) on delete restrict,
  status text not null default 'Pending'
    constraint student_specialisations_status_check check (status in ('Pending', 'Approved', 'Rejected', 'Cancelled')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz not null default now()
);

create unique index student_specialisations_one_open_idx
  on public.student_specialisations(student_id)
  where status in ('Pending', 'Approved');

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Index every foreign key and the columns used by access policies.
create index batches_course_id_idx on public.batches(course_id);
create index groups_batch_id_idx on public.groups(batch_id);
create index students_profile_id_idx on public.students(profile_id);
create index trainers_profile_id_idx on public.trainers(profile_id);
create index student_enrollments_student_id_idx on public.student_enrollments(student_id);
create index student_enrollments_course_id_idx on public.student_enrollments(course_id);
create index student_enrollments_batch_id_idx on public.student_enrollments(batch_id);
create index student_enrollments_group_id_idx on public.student_enrollments(group_id);
create index subjects_course_id_idx on public.subjects(course_id);
create index modules_subject_id_idx on public.modules(subject_id);
create index trainer_assignments_trainer_id_idx on public.trainer_assignments(trainer_id);
create index trainer_assignments_subject_id_idx on public.trainer_assignments(subject_id);
create index trainer_assignments_batch_id_idx on public.trainer_assignments(batch_id);
create index trainer_assignments_group_id_idx on public.trainer_assignments(group_id);
create index specialisation_options_course_id_idx on public.specialisation_options(course_id);
create index student_specialisations_student_id_idx on public.student_specialisations(student_id);
create index student_specialisations_specialisation_id_idx on public.student_specialisations(specialisation_id);
create index student_specialisations_reviewed_by_idx on public.student_specialisations(reviewed_by);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.account_status = 'Active'
$$;

create or replace function private.current_student_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.students s
  join public.profiles p on p.id = s.profile_id
  where s.profile_id = (select auth.uid())
    and s.account_status = 'Active'
    and p.account_status = 'Active'
$$;

create or replace function private.current_trainer_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select t.id
  from public.trainers t
  join public.profiles p on p.id = t.profile_id
  where t.profile_id = (select auth.uid())
    and t.is_active
    and p.account_status = 'Active'
$$;

revoke all on function private.current_user_role() from public, anon;
revoke all on function private.current_student_id() from public, anon;
revoke all on function private.current_trainer_id() from public, anon;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_student_id() to authenticated;
grant execute on function private.current_trainer_id() to authenticated;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  insert into public.profiles (id, username, email, full_name, role)
  values (
    new.id,
    coalesce(requested_username, split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8)),
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    'Student'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function private.handle_new_auth_user();

-- A compatibility read view lets the existing frontend transition safely.
create view public.user_profiles
with (security_invoker = true)
as
select
  id,
  email,
  full_name,
  role,
  null::text as department,
  (select s.id::text from public.students s where s.profile_id = profiles.id) as student_id,
  (select s.ut_number::text from public.students s where s.profile_id = profiles.id) as ut_number,
  avatar_url,
  created_at,
  updated_at
from public.profiles;

-- RLS is enabled on every table exposed through the Data API.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.trainers enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.subjects enable row level security;
alter table public.modules enable row level security;
alter table public.trainer_assignments enable row level security;
alter table public.specialisation_options enable row level security;
alter table public.student_specialisations enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.user_profiles, public.courses, public.batches,
  public.groups, public.students, public.trainers, public.student_enrollments,
  public.subjects, public.modules, public.trainer_assignments,
  public.specialisation_options, public.student_specialisations,
  public.system_settings to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant insert, update on public.student_specialisations to authenticated;

create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.current_user_role()) = 'Admin');
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) and account_status = 'Active')
  with check (id = (select auth.uid()) and account_status = 'Active');

create policy courses_read on public.courses for select to authenticated
  using ((select private.current_user_role()) is not null);
create policy batches_read on public.batches for select to authenticated
  using ((select private.current_user_role()) is not null);
create policy groups_read on public.groups for select to authenticated
  using ((select private.current_user_role()) is not null);
create policy subjects_read on public.subjects for select to authenticated
  using ((select private.current_user_role()) is not null);
create policy modules_read on public.modules for select to authenticated
  using ((select private.current_user_role()) is not null);
create policy specialisation_options_read on public.specialisation_options for select to authenticated
  using ((select private.current_user_role()) is not null);

create policy students_read on public.students for select to authenticated
  using (
    (select private.current_user_role()) = 'Admin'
    or id = (select private.current_student_id())
    or exists (
      select 1
      from public.student_enrollments se
      join public.trainer_assignments ta
        on ta.batch_id = se.batch_id
       and (ta.group_id is null or ta.group_id = se.group_id)
      where se.student_id = students.id
        and se.status = 'Active'
        and ta.trainer_id = (select private.current_trainer_id())
        and ta.is_active
        and (ta.ends_on is null or ta.ends_on >= current_date)
    )
  );

create policy trainers_read on public.trainers for select to authenticated
  using (
    (select private.current_user_role()) = 'Admin'
    or id = (select private.current_trainer_id())
  );

create policy enrollments_read on public.student_enrollments for select to authenticated
  using (
    (select private.current_user_role()) = 'Admin'
    or student_id = (select private.current_student_id())
    or exists (
      select 1 from public.trainer_assignments ta
      where ta.batch_id = student_enrollments.batch_id
        and (ta.group_id is null or ta.group_id = student_enrollments.group_id)
        and ta.trainer_id = (select private.current_trainer_id())
        and ta.is_active
        and (ta.ends_on is null or ta.ends_on >= current_date)
    )
  );

create policy trainer_assignments_read on public.trainer_assignments for select to authenticated
  using (
    (select private.current_user_role()) = 'Admin'
    or trainer_id = (select private.current_trainer_id())
  );

create policy student_specialisations_read on public.student_specialisations for select to authenticated
  using (
    (select private.current_user_role()) = 'Admin'
    or student_id = (select private.current_student_id())
  );
create policy student_specialisations_insert on public.student_specialisations for insert to authenticated
  with check (
    student_id = (select private.current_student_id())
    and status = 'Pending'
    and reviewed_by is null
    and reviewed_at is null
  );
create policy student_specialisations_cancel on public.student_specialisations for update to authenticated
  using (student_id = (select private.current_student_id()) and status = 'Pending')
  with check (
    student_id = (select private.current_student_id())
    and status = 'Cancelled'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy settings_admin_read on public.system_settings for select to authenticated
  using ((select private.current_user_role()) = 'Admin');
create policy audit_admin_read on public.audit_logs for select to authenticated
  using ((select private.current_user_role()) = 'Admin');

-- All privileged writes are intentionally reserved for trusted server clients.
grant insert, update, delete on public.courses, public.batches, public.groups,
  public.students, public.trainers, public.student_enrollments, public.subjects,
  public.modules, public.trainer_assignments, public.specialisation_options,
  public.system_settings to service_role;
grant insert on public.audit_logs to service_role;

commit;
