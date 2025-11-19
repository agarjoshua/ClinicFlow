-- Check all users in the table
SELECT id, user_id, name, email, role, clinic_id 
FROM users;

-- Check if RLS is blocking (run as service_role or disable RLS temporarily)
-- If no results above, RLS might be preventing the SELECT

-- Check auth users exist
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('demo.consultant@zahaniflow.com', 'demo.assistant@zahaniflow.com');
