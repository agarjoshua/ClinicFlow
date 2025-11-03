-- Fix RLS policies for medical_images table
-- This allows authenticated users to insert their own media records

-- First, check if RLS is enabled
-- ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

-- Policy 1: Allow authenticated users to INSERT their own media
CREATE POLICY "authenticated_can_insert_medical_images"
ON medical_images
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Allow authenticated users to READ all media (for patient profiles)
CREATE POLICY "authenticated_can_read_medical_images"
ON medical_images
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy 3: Allow authenticated users to UPDATE their own media
CREATE POLICY "authenticated_can_update_medical_images"
ON medical_images
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: Allow authenticated users to DELETE their own media
CREATE POLICY "authenticated_can_delete_medical_images"
ON medical_images
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Verify policies are in place
SELECT * FROM pg_policies WHERE tablename = 'medical_images';
