-- ============================================
-- COMPLETE FIX: Storage Upload RLS Policies
-- ============================================
-- This fixes the "400 Bad Request" and "new row violates row-level security policy" errors
-- when uploading files to the medical-media bucket.

-- PART 1: Storage Object Policies (THIS IS WHAT'S MISSING!)
-- These control access to storage.objects table where file metadata is stored

-- Drop any existing storage policies for medical-media
DROP POLICY IF EXISTS "Allow authenticated uploads to medical-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from medical-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from medical-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to medical-media" ON storage.objects;

-- Policy 1: Allow authenticated users to UPLOAD files to medical-media bucket
CREATE POLICY "Allow authenticated uploads to medical-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-media');

-- Policy 2: Allow anyone to READ files from medical-media (it's a public bucket)
CREATE POLICY "Allow public reads from medical-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'medical-media');

-- Policy 3: Allow authenticated users to DELETE their files
CREATE POLICY "Allow authenticated deletes from medical-media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'medical-media');

-- Policy 4: Allow authenticated users to UPDATE file metadata
CREATE POLICY "Allow authenticated updates to medical-media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'medical-media');

-- ============================================
-- PART 2: Medical Images Table Policies
-- ============================================
-- These control access to the medical_images table where we store file metadata

-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;
DROP POLICY IF EXISTS "INSERT_ANY" ON medical_images;
DROP POLICY IF EXISTS "SELECT_ANY" ON medical_images;
DROP POLICY IF EXISTS "UPDATE_ANY" ON medical_images;
DROP POLICY IF EXISTS "DELETE_ANY" ON medical_images;

-- Reset RLS
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "INSERT_ANY" ON medical_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "SELECT_ANY" ON medical_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "UPDATE_ANY" ON medical_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "DELETE_ANY" ON medical_images FOR DELETE TO authenticated USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check storage.objects policies (should return 4 rows)
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%medical-media%'
ORDER BY policyname;

-- Check medical_images policies (should return 4 rows)
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'medical_images'
ORDER BY policyname;

-- Summary
SELECT 
  'storage.objects' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%medical-media%'
UNION ALL
SELECT 
  'medical_images' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'medical_images';
