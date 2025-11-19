-- Migration 017: Allow new users to create clinics during signup
-- Date: 2025-11-18
-- Enables clinic and user profile creation for new signups

BEGIN;

-- Allow authenticated users to create their own clinic during signup
CREATE POLICY "Users can create own clinic" ON clinics
  FOR INSERT 
  WITH CHECK (owner_id = auth.uid());

-- Allow new users to create their own profile
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMIT;
