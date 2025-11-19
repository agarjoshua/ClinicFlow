-- Debug query to test users table access
-- Run this in Supabase SQL Editor while logged in as your user

-- Check what get_user_clinic_id() returns for current user
SELECT get_user_clinic_id() as my_clinic_id;

-- Check current user's auth.uid()
SELECT auth.uid() as my_auth_uid;

-- Check users table for current user
SELECT user_id, email, clinic_id, role 
FROM users 
WHERE user_id = auth.uid();

-- Try to select all users (should only see same clinic users due to RLS)
SELECT user_id, email, clinic_id, role, name
FROM users;

-- Check if there are any users with your clinic_id
SELECT user_id, email, clinic_id, role, name
FROM users
WHERE clinic_id = get_user_clinic_id();
