-- ========================================
-- DIAGNOSTIC QUERIES - Run These First
-- ========================================

-- 1. Check if medical_images table has any data
SELECT COUNT(*) as total_images FROM medical_images;
-- Expected: 0 (this is your problem - nothing saved)

-- 2. Check if storage bucket has files
SELECT COUNT(*) as total_files FROM storage.objects WHERE bucket_id = 'medical-media';
-- Expected: 1 or more (files ARE uploading)

-- 3. Check if storage.objects has RLS policies for medical-media
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%medical-media%';
-- Expected: 4 (if you ran the SQL)
-- Actual: Probably 0 (policies not created yet)

-- 4. Check if medical_images table has RLS policies
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'medical_images';
-- Expected: 4
-- Actual: Probably 0 or incorrect policies

-- 5. List all files in storage
SELECT name, created_at, metadata 
FROM storage.objects 
WHERE bucket_id = 'medical-media' 
ORDER BY created_at DESC 
LIMIT 10;
-- This shows your uploaded files

-- 6. Check RLS status on medical_images
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'medical_images';
-- Should show: rls_enabled = true

-- ========================================
-- DIAGNOSIS RESULTS
-- ========================================
-- If query 1 returns 0: Database insert is failing
-- If query 2 returns >0: Storage upload is working
-- If query 3 returns 0: Storage RLS policies MISSING
-- If query 4 returns 0: Table RLS policies MISSING
--
-- SOLUTION: Run COMPLETE_STORAGE_FIX.sql
-- ========================================
