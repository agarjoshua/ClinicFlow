-- Fix orphaned auth user (leeogutha@gmail.com)
-- This user exists in auth.users but not in public.users table

-- First, check if the user exists in auth.users and get their ID
-- Run this to see the auth user:
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'leeogutha@gmail.com';

-- Option 1: Create a profile for the existing auth user
-- Replace 'PASTE_AUTH_USER_ID_HERE' with the actual UUID from the query above
-- Replace 'PASTE_CLINIC_ID_HERE' with your clinic ID: e41fdf1e-0836-46a6-afad-81b1874d5df5


INSERT INTO users (user_id, name, email, role, clinic_id, created_at, updated_at)
VALUES (
  '1aeb8840-eb4a-4fc1-a207-17df91d18cb4',
  'Dr. Lee Ogutha',
  'leeogutha@gmail.com',
  'consultant',
  'e41fdf1e-0836-46a6-afad-81b1874d5df5',
  now(),
  now()
);


-- Option 2: Delete the auth user completely and let them sign up fresh
-- (Uncomment to use this option instead)
/*
DELETE FROM auth.users WHERE email = 'leeogutha@gmail.com';
*/
