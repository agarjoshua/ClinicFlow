-- Create superadmin user
-- This creates a special superadmin account for platform management

-- First, you need to create the auth user in Supabase Auth Dashboard with:
-- Email: superadmin@zahaniflow.com
-- Password: (set a strong password)
-- Then get the auth user ID and replace YOUR_SUPERADMIN_AUTH_UID below

-- Insert superadmin profile
-- Replace YOUR_SUPERADMIN_AUTH_UID with the actual auth user ID from Supabase Auth
INSERT INTO users (user_id, name, email, role, phone, clinic_id)
VALUES (
  '2b496e37-cbe3-447e-a461-7fe3248ee1a4'::uuid,
  'Super Admin',
  'tech@zahaniflow.com',
  'superadmin',
  NULL,
  NULL  -- Superadmin doesn't belong to any clinic
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'superadmin',
  name = 'Super Admin';

-- Query to verify
SELECT id, user_id, name, email, role, clinic_id 
FROM users 
WHERE role = 'superadmin';
