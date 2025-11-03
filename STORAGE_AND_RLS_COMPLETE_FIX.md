# 🚨 CRITICAL FIX: Storage 400 Bad Request + RLS Policy Issues

## You Have TWO Errors:

1. **400 Bad Request** (Storage upload failing)
2. **RLS Policy Violation** (Database insert failing)

---

## STEP 1: Fix Storage Bucket Permissions

The 400 error means the bucket exists but has wrong permissions.

### Go to Supabase Storage Settings:

1. https://app.supabase.com → Select **ClinicFlow** project
2. Click **Storage** (left sidebar)
3. Find **medical-media** bucket
4. Click the **three dots** → **Edit**

### Check These Settings:

```
Bucket Name: medical-media
Public Bucket: ✅ TOGGLE ON (must be enabled)
File Size Limit: 52428800 (50MB) - or increase if needed
Allowed MIME Types: Leave empty (allow all)
```

### If You Don't See The Bucket:

Create it:
1. Storage → **New Bucket**
2. Name: `medical-media`
3. **Toggle Public ON**
4. Click **Create Bucket**

---

## STEP 2: Create Storage Access Policies

Even though it's public, it needs policies for authenticated access.

Go to **Authentication** → **Policies** → Find **storage.objects** table

Create these policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' 
  AND bucket_id = 'medical-media'
);

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated read"
ON storage.objects
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'medical-media'
);

-- Allow anyone to read public files
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'medical-media');
```

---

## STEP 3: Fix Database RLS Policies (The Real Blocker)

Your medical_images table has RLS blocking inserts. **This is the main issue**.

### Go to Supabase SQL Editor:

1. https://app.supabase.com → **SQL Editor**
2. **New Query**
3. Copy-paste this complete SQL:

```sql
-- ============================================
-- RESET AND FIX MEDICAL_IMAGES RLS POLICIES
-- ============================================

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON medical_images;
DROP POLICY IF EXISTS "Allow SELECT for all" ON medical_images;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users" ON medical_images;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users" ON medical_images;

-- Step 2: Disable RLS temporarily
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

-- Step 4: Create working policies (permissive for now)
CREATE POLICY "INSERT_ANY"
ON medical_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "SELECT_ANY"
ON medical_images
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "UPDATE_ANY"
ON medical_images
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "DELETE_ANY"
ON medical_images
FOR DELETE
TO authenticated
USING (true);

-- Step 5: Verify
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'medical_images') as policy_count
FROM pg_tables
WHERE tablename = 'medical_images';
```

4. Click **Execute** (or Ctrl+Enter)
5. You should see: `Successfully completed`

---

## STEP 4: Verify Everything Is Fixed

Run these verification queries in SQL Editor:

```sql
-- Check 1: RLS enabled?
SELECT rowsecurity FROM pg_tables WHERE tablename = 'medical_images';
-- Should return: true

-- Check 2: How many policies?
SELECT COUNT(*) as count FROM pg_policies WHERE tablename = 'medical_images';
-- Should return: 4

-- Check 3: Storage object policies exist?
SELECT COUNT(*) as count FROM pg_policies WHERE tablename = 'objects';
-- Should return: 2+

-- Check 4: Current rows in medical_images?
SELECT COUNT(*) as count FROM medical_images;
-- Will probably return: 0 (but should insert next time)
```

---

## STEP 5: Test the App

1. **Refresh ClinicFlow** (Ctrl+R or Cmd+R)
2. Go to **Diagnoses** tab
3. Select an appointment
4. Upload a test image:
   - Click **Image**
   - Choose file
   - Add description
   - Click "Add Media"
5. Click **Save Diagnosis**
6. ✅ Should succeed now!

---

## STEP 6: Verify Media Saved

Check that media actually saved:

```sql
-- Should return > 0 after upload
SELECT COUNT(*) FROM medical_images;

-- Should show your uploaded file
SELECT id, file_name, file_type, uploaded_at FROM medical_images ORDER BY uploaded_at DESC LIMIT 5;
```

---

## If Still Getting 400 Error:

The 400 error might be coming from a **file format issue**. Try this fix in diagnoses.tsx:

Change the upload to use `upsert` with `cacheControl`:

```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from("medical-media")
  .upload(fileName, media.file, {
    upsert: false,
    cacheControl: '3600',
    contentType: media.file.type || 'application/octet-stream'
  });
```

---

## If Still Getting RLS Error:

That means policies STILL didn't apply. Try the **NUCLEAR OPTION**:

```sql
-- Completely disable RLS (⚠️ NOT for production)
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;
```

Then test the upload. If it works, RLS is the problem. Then we'll fix it properly.

---

## Summary of What Each Fix Does:

| Issue | Cause | Fix |
|-------|-------|-----|
| 400 Bad Request | Storage bucket not public or upload policy missing | Set bucket to public + create upload policies |
| RLS Policy Error | Policies blocking authenticated users | Drop old policies, create permissive ones with `TO authenticated` |
| File not saving | Combined storage + RLS issue | Do both steps above |

---

## Questions?

1. **Is medical-media bucket public?** - Check Storage settings
2. **Did RLS SQL execute successfully?** - Check SQL editor output
3. **Can you see 4 policies in pg_policies?** - Run verification query
4. **Is the file actually uploading to storage?** - Check Storage bucket contents

---

**Next: Try these fixes and report back with results!** ✅
