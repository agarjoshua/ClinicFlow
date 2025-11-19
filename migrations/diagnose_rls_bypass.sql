-- CRITICAL TEST: Check if you're bypassing RLS
-- This will show if you're running queries as service_role (which bypasses RLS)

-- 1. Check your current role
SELECT current_user, session_user;

-- 2. Check if RLS is actually enabled on tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('patients', 'hospitals', 'clinic_sessions')
ORDER BY tablename;

-- 3. List all RLS policies that exist
SELECT tablename, policyname, cmd, qual::text as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('patients', 'hospitals', 'clinic_sessions')
ORDER BY tablename, cmd;

-- 4. Test the function
SELECT get_user_clinic_id() as function_result;
SELECT auth.uid() as auth_uid_result;

-- ============================================
-- DIAGNOSIS:
-- ============================================
-- If current_user = 'postgres' or 'service_role': YOU ARE BYPASSING RLS!
--   Solution: In Supabase SQL Editor, switch to "Run as authenticated user" or disable service_role mode
--
-- If rowsecurity = false: RLS is not enabled on that table
--   Solution: Re-run migration 018
--
-- If no policies are listed: Policies weren't created
--   Solution: Re-run migration 018
--
-- If get_user_clinic_id() returns NULL: User doesn't have a clinic_id
--   Solution: Check the users table
