# TIC360 security deployment checklist

Apply these steps in order. Do not expose the application to real users between steps 1 and 5.

1. Put the current deployment in maintenance/restricted mode.
2. Take a Supabase database backup.
3. In Supabase SQL Editor, run `supabase_security_hardening.sql` once.
4. In Authentication > Users, reset the passwords for every existing staff/demo account.
5. In SQL Editor, assign staff roles to the intended users only:

   ```sql
   update public.user_profiles set role = 'Admin'
   where email = 'admin@unicomtic.lk';

   update public.user_profiles set role = 'Blossom Trust Officer'
   where email = 'trustee@blossom.org';

   update public.user_profiles set role = 'Trainer'
   where email = 'trainer@unicomtic.lk';

   update public.user_profiles set role = 'Data Entry Officer'
   where email = 'dataentry@unicomtic.lk';
   ```

6. Deploy this code revision. Do not restore the removed attendance workbooks under `public/`.
7. Test with one account for each role and confirm forbidden modules/data cannot be accessed.
8. Remove the deleted workbooks and any exposed credentials from Git history before making the repository public or sharing old commits.

Staff users must be created/reset through Supabase Auth or another trusted server-side admin workflow. Browser-based staff seeding and local/offline password authentication are intentionally disabled.
