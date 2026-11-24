begin;

grant insert, update on public.courses, public.batches, public.groups,
  public.subjects, public.modules to authenticated;
grant usage, select on sequence public.courses_id_seq, public.batches_id_seq,
  public.groups_id_seq, public.subjects_id_seq, public.modules_id_seq to authenticated;

create policy courses_admin_insert on public.courses for insert to authenticated
  with check ((select private.current_user_role()) = 'Admin');
create policy courses_admin_update on public.courses for update to authenticated
  using ((select private.current_user_role()) = 'Admin')
  with check ((select private.current_user_role()) = 'Admin');

create policy batches_admin_insert on public.batches for insert to authenticated
  with check ((select private.current_user_role()) = 'Admin');
create policy batches_admin_update on public.batches for update to authenticated
  using ((select private.current_user_role()) = 'Admin')
  with check ((select private.current_user_role()) = 'Admin');

create policy groups_admin_insert on public.groups for insert to authenticated
  with check ((select private.current_user_role()) = 'Admin');
create policy groups_admin_update on public.groups for update to authenticated
  using ((select private.current_user_role()) = 'Admin')
  with check ((select private.current_user_role()) = 'Admin');

create policy subjects_admin_insert on public.subjects for insert to authenticated
  with check ((select private.current_user_role()) = 'Admin');
create policy subjects_admin_update on public.subjects for update to authenticated
  using ((select private.current_user_role()) = 'Admin')
  with check ((select private.current_user_role()) = 'Admin');

create policy modules_admin_insert on public.modules for insert to authenticated
  with check ((select private.current_user_role()) = 'Admin');
create policy modules_admin_update on public.modules for update to authenticated
  using ((select private.current_user_role()) = 'Admin')
  with check ((select private.current_user_role()) = 'Admin');

commit;
