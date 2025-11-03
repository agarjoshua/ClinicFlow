# ⚡ IMMEDIATE ACTION REQUIRED - Storage & RLS Fixes

## 🚨 YOUR CURRENT SITUATION

✅ **File uploads to storage bucket** - You can see files in bucket  
❌ **Database has 0 rows in medical_images** - This is why patients don't show images  
❌ **RLS policy blocking INSERT** - The root cause

## The Problem

When you save a diagnosis with media:
1. File uploads to storage ✅ (working - you see it in bucket)
2. Code tries to INSERT metadata to medical_images table ❌ (BLOCKED by RLS)
3. Patient page queries medical_images table → finds 0 rows → shows no images

**You MUST run the SQL below to fix this!**

---

## Quick Fix (5 minutes)

### STEP 1: Verify Storage Bucket is PUBLIC

https://app.supabase.com → Storage → medical-media

**MUST have:**
```
✅ Bucket Name: medical-media
✅ Public Bucket: ENABLED (toggle ON)
```

If NOT public:
- Click **Settings**
- Toggle **Public** ON
- Save

---

### STEP 2: Fix RLS Policies (CRITICAL - THE REAL FIX!)

Go to: https://app.supabase.com → SQL Editor → New Query

**Copy-paste COMPLETE SQL from COMPLETE_STORAGE_FIX.sql or paste this:**

```sql
-- STORAGE POLICIES (THIS WAS THE MISSING PIECE!)
DROP POLICY IF EXISTS "Allow authenticated uploads to medical-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from medical-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from medical-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to medical-media" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to medical-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medical-media');

CREATE POLICY "Allow public reads from medical-media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'medical-media');

CREATE POLICY "Allow authenticated deletes from medical-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'medical-media');

CREATE POLICY "Allow authenticated updates to medical-media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'medical-media');

-- MEDICAL_IMAGES TABLE POLICIES
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;
DROP POLICY IF EXISTS "INSERT_ANY" ON medical_images;
DROP POLICY IF EXISTS "SELECT_ANY" ON medical_images;
DROP POLICY IF EXISTS "UPDATE_ANY" ON medical_images;
DROP POLICY IF EXISTS "DELETE_ANY" ON medical_images;

ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "INSERT_ANY" ON medical_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "SELECT_ANY" ON medical_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "UPDATE_ANY" ON medical_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "DELETE_ANY" ON medical_images FOR DELETE TO authenticated USING (true);
```

**Execute:** Click ▶ or Ctrl+Enter

**Wait for:** "Successfully completed"

**Verify it worked by running this:**
```sql
-- Should return 4 rows for storage, 4 rows for medical_images
SELECT 
  'storage.objects' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%medical-media%'
UNION ALL
SELECT 
  'medical_images' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'medical_images';
```

Expected result:
```
storage.objects  | 4
medical_images   | 4
```

---

### STEP 3: Verify Data is Now Saving

Run this to check database now has data:

```sql
SELECT COUNT(*) as total FROM medical_images;
```

**Before fix:** Returns `0`  
**After fix:** Should return `1` or more

**If still 0:** You need to upload a NEW image after running the SQL (old uploads didn't save to DB)

---

### STEP 4: Re-upload Image (Important!)

The images you uploaded BEFORE running the SQL are only in storage, not in the database.

1. **Refresh ClinicFlow:** Ctrl+R
2. **Go to:** Diagnoses tab
3. **Upload image again** (for a diagnosis)
4. **Save Diagnosis**
5. **Check:** `SELECT COUNT(*) FROM medical_images;` should now show 1+

---

### STEP 5: View on Patient Page

1. Go to **Patients** tab
2. Click the patient you just added diagnosis for
3. Scroll to **Clinical Cases & Medical Records**
4. ✅ You should see the image displayed next to the diagnosis

---

## If Still Failing

### 400 Bad Request Error?
- Check: Storage bucket is PUBLIC (Step 1)
- Check: File size < 50MB
- Try: Different file format (JPG instead of PNG)

### RLS Policy Error Still?
- Run verification query:
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'medical_images';
```
- Should return: `4`
- If not, re-run the SQL in Step 2

### Still Stuck?
Check these:
```sql
-- Is RLS enabled?
SELECT rowsecurity FROM pg_tables WHERE tablename = 'medical_images';
-- Should be: true

-- How many policies?
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename = 'medical_images' ORDER BY policyname;
-- Should show 4 rows
```

---

## What Changed

Code now has:
- ✅ Better error logging
- ✅ Proper content-type handling
- ✅ File upload with cache control
- ✅ Diagnostic console output

**No major changes - just better debugging!**

---

## After This Works

Once you can upload media:
1. Go to Patients tab
2. Click a patient  
3. Scroll to Clinical Cases
4. See uploaded images with preview
5. Click to view full size

---

**👉 START WITH STEP 1 - Make sure storage bucket is PUBLIC!**
6. Go to Patients → See your image in Clinical Cases

---

## Why This Works

The SQL creates 4 **RLS Policies** that tell Supabase:
- ✅ Authenticated users CAN insert media records
- ✅ Authenticated users CAN read media records
- ✅ Authenticated users CAN update media records
- ✅ Authenticated users CAN delete media records

Without these policies, Supabase blocks all database access (security feature).

---

## Reference

**Already have the SQL?**
→ File: `fix-medical-images-rls.sql`

**Need detailed help?**
→ File: `COMPLETE_RLS_FIX_GUIDE.md`

**Prefer quick reference?**
→ File: `QUICK_FIX_RLS.md`

---

**That's all you need to do!** 🚀

After running the SQL:
- Media uploads work ✅
- Media displays on patient page ✅
- Preview dialog works ✅
- Feature complete ✅

Go to SQL Editor now! →
