-- Fix orphaned auth user (leeogutha@gmail.com)
-- The profile EXISTS but user_id might be mismatched with auth.users

-- Step 1: Check auth.users
SELECT id as auth_user_id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'leeogutha@gmail.com';

-- Step 2: Check public.users table
SELECT user_id, email, name, role, clinic_id
FROM users
WHERE email = 'leeogutha@gmail.com';

-- Step 3: If the user_id in public.users doesn't match auth.users id, fix it:
-- The auth user ID from Step 1 should be: 1aeb8840-eb4a-4fc1-a207-17df91d18cb4
UPDATE users
SET user_id = '1aeb8840-eb4a-4fc1-a207-17df91d18cb4'
WHERE email = 'leeogutha@gmail.com';

-- If the issue is missing clinic_id, fix it:
/*
UPDATE users
SET clinic_id = 'e41fdf1e-0836-46a6-afad-81b1874d5df5'
WHERE email = 'leeogutha@gmail.com';
*/
