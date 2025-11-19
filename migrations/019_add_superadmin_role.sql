-- Add 'superadmin' to the allowed roles in users table
-- This migration updates the role check constraint to allow superadmin role

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes 'superadmin'
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('consultant', 'assistant', 'superadmin'));

-- Verify the constraint
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
  AND conname = 'users_role_check';
