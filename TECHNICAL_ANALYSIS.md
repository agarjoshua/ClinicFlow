# 🔍 Technical Analysis of Your Errors

## Error 1: `400 Bad Request` on File Upload

### What's Happening
```
POST https://unmukqwddceoywfmguwg.supabase.co/storage/v1/object/medical-media/1762197473774-...jpeg 400
```

The file IS reaching the Supabase storage API, but it's rejecting it with 400.

### Most Likely Causes
1. **Bucket is NOT public** (most common)
   - Storage bucket `medical-media` exists but has "Public" toggle OFF
   - Fix: Toggle it ON in Storage settings
   
2. **Missing storage upload policies**
   - Even public buckets need RLS policies for authenticated uploads
   - Fix: Create storage.objects policies
   
3. **Bucket configuration issue**
   - MIME type restrictions too strict
   - File size limit exceeded
   - Fix: Adjust bucket settings

### Debug Steps
```sql
-- Check if bucket exists and is public
SELECT name, public FROM storage.buckets WHERE name = 'medical-media';
-- Should show: medical-media | true

-- Check storage policies
SELECT policyname, definition FROM pg_policies 
WHERE tablename = 'objects' ORDER BY policyname;
-- Should show upload/download policies
```

---

## Error 2: `RLS policy violation` on Metadata Insert

### What's Happening
```
StorageApiError: new row violates row-level security policy
    at diagnoses.tsx:268
```

File uploads to storage ✅, but database insert fails ❌.

### The Problem
The `medical_images` table has RLS enabled with **no policies** or **incorrect policies**.

When you try to `INSERT` into medical_images:
1. Supabase checks RLS policies
2. No matching policy found that allows INSERT
3. Request denied with "violates row-level security"

### The Solution
You need **4 policies** on medical_images table:

| Operation | Rule | Allows |
|-----------|------|--------|
| INSERT | `TO authenticated WITH CHECK (true)` | Any logged-in user can create |
| SELECT | `TO authenticated USING (true)` | Any logged-in user can read |
| UPDATE | `TO authenticated USING/WITH CHECK (true)` | Any logged-in user can edit |
| DELETE | `TO authenticated USING (true)` | Any logged-in user can remove |

### Why Your Previous SQL Failed
The old SQL had:
```sql
CREATE POLICY ... WITH CHECK (auth.uid() IS NOT NULL)
```

This checks if `auth.uid()` exists, but:
- Might not have executed successfully
- Might have conflicted with existing policies
- The auth context might not be passed correctly from client

### The Fix
The new SQL:
1. **Drops ALL old policies** (clears conflicts)
2. **Disables then re-enables RLS** (resets state)
3. **Creates new simple policies** (with `WITH CHECK (true)`)
4. **Uses `TO authenticated`** (only for logged-in users)

---

## Code Changes Made

### diagnoses.tsx (Line 240-290)

**Before:**
```typescript
const fileName = `${clinicalCase.id}/${Date.now()}-${media.file.name}`;
const { data: uploadData, error: uploadError } = await supabase.storage
  .from("medical-media")
  .upload(fileName, media.file);
```

**After:**
```typescript
const sanitizedFileName = media.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
const fileName = `${Date.now()}-${clinicalCase.id}-${sanitizedFileName}`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from("medical-media")
  .upload(fileName, media.file, {
    cacheControl: '3600',
    contentType: media.file.type || 'application/octet-stream'
  });
```

**Changes:**
- ✅ Removed subdirectory path (flat structure)
- ✅ Added sanitization for filename
- ✅ Added contentType specification
- ✅ Added cacheControl header
- ✅ Added try-catch blocks
- ✅ Added console logging for debugging

---

## Expected Flow After Fixes

```
User uploads image in Diagnoses
    ↓
Image added to mediaItems array (local state) ✅
    ↓
User clicks "Save Diagnosis"
    ↓
clinicalCase created in database ✅
    ↓
For each media item:
    ├─ File uploaded to storage ✅ (needs public bucket)
    ├─ Public URL retrieved ✅
    └─ Metadata inserted to medical_images ✅ (needs RLS policies)
    ↓
Diagnosis saved successfully ✅
    ↓
User views Patients page
    ↓
Patient detail page queries clinical_cases
    ↓
For each case, fetches medical_images ✅
    ↓
Gallery displays image thumbnails
    ↓
User clicks image to preview ✅
```

---

## Verification Queries

After applying fixes, these should all succeed:

```sql
-- 1. Check bucket is public
SELECT name, public FROM storage.buckets WHERE name = 'medical-media';
-- Result: medical-media | true

-- 2. Check RLS is enabled on medical_images
SELECT rowsecurity FROM pg_tables WHERE tablename = 'medical_images';
-- Result: true

-- 3. Check 4 policies exist
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'medical_images';
-- Result: 4

-- 4. List the policies
SELECT policyname FROM pg_policies WHERE tablename = 'medical_images' ORDER BY policyname;
-- Result: 4 rows (DELETE_ANY, INSERT_ANY, SELECT_ANY, UPDATE_ANY)

-- 5. Check if any media saved
SELECT COUNT(*) FROM medical_images;
-- Result: 0 (for now, will be 1+ after first upload)

-- 6. Check file in storage
SELECT name FROM storage.objects WHERE bucket_id = 'medical-media' LIMIT 5;
-- Result: files with pattern {timestamp}-{case-id}-{filename}
```

---

## If Problems Persist

### Problem: Still getting 400 on upload

**Diagnostic:**
```sql
-- Is bucket really public?
SELECT public FROM storage.buckets WHERE name = 'medical-media';

-- Any upload policies?
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%upload%';

-- Check MIME restrictions
SELECT * FROM storage.buckets WHERE name = 'medical-media';
```

**Solutions to try:**
1. Recreate bucket with all defaults
2. Delete old policies, add new ones
3. Check file format (try JPG, then PNG, then GIF)

### Problem: Still getting RLS error

**Diagnostic:**
```sql
-- How many policies really exist?
SELECT policyname, qual, with_check FROM pg_policies 
WHERE tablename = 'medical_images';

-- If 0 rows, policies didn't apply
-- If > 0, check the definitions match expected
```

**Solutions:**
1. Drop and recreate: `DROP POLICY IF EXISTS ...` then `CREATE POLICY ...`
2. Nuclear option: `ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;` (temporary testing)
3. Check PostgreSQL logs in Supabase dashboard

---

## Success Indicators

✅ **Storage upload working** when you see in console:
```
Uploading file: 1762197473774-..., Size: 245600, Type: image/jpeg
File uploaded successfully: https://...storage.supabase.co/...
```

✅ **Database insert working** when you see:
```sql
SELECT COUNT(*) FROM medical_images; -- Returns: 1
```

✅ **Display working** when you see on patient page:
- Clinical Cases section appears
- Media thumbnails show with images
- Click preview opens full image

---

## References

- **Supabase Storage Docs:** https://supabase.com/docs/guides/storage
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security
- **Storage RLS:** https://supabase.com/docs/guides/storage/access-control
