drop view if exists public.user_profiles;

create view public.user_profiles
with (security_invoker = true)
as
select
  id,
  username::text as username,
  email::text as email,
  full_name,
  role,
  account_status,
  must_change_password,
  temporary_password_expires_at,
  first_login_completed_at,
  last_password_change_at,
  null::text as department,
  (select s.id::text from public.students s where s.profile_id = profiles.id) as student_id,
  (select s.ut_number::text from public.students s where s.profile_id = profiles.id) as ut_number,
  avatar_url,
  created_at,
  updated_at
from public.profiles;

grant select on public.user_profiles to authenticated;
