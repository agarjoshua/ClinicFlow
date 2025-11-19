-- Check if RLS policies exist and are correct
-- Run this to verify your RLS setup

-- 1. Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'clinics', 'hospitals', 'patients', 'clinic_sessions', 'appointments')
ORDER BY tablename;

-- 2. Check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check if get_user_clinic_id() function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_clinic_id';

-- 4. Test what clinic_id the current user gets
SELECT get_user_clinic_id() as my_clinic_id, auth.uid() as my_auth_uid;

-- 5. Check which clinic each user belongs to
SELECT user_id, name, email, role, clinic_id 
FROM users 
ORDER BY clinic_id, name;
