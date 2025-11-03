# 🔍 Debugging: Media Not Showing - Diagnostic Guide

## Problem: File uploaded but not showing on patient page

### Possible Causes

1. **RLS policies not working properly**
2. **media_images table not being queried correctly**
3. **clinical_case_id mismatch**
4. **Browser cache issue**
5. **Database connection issue**

---

## Step 1: Check Browser Console

1. Open ClinicFlow app
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Look for any red error messages
5. Screenshot and share the errors

Common errors:
```
- "Bucket not found" → Storage bucket missing
- "permission denied" → RLS policy issue
- "relation does not exist" → Table missing
```

---

## Step 2: Verify RLS Policies Exist

Go to Supabase SQL Editor and run:

```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'medical_images' 
ORDER BY policyname;
```

Should show 4 rows:
```
authenticated_can_delete_medical_images | DELETE
authenticated_can_insert_medical_images | INSERT
authenticated_can_read_medical_images   | SELECT
authenticated_can_update_medical_images | UPDATE
```

If you don't see these 4, RLS policies weren't created. Run the SQL from `fix-medical-images-rls.sql` again.

---

## Step 3: Check Medical Images Table

Run this SQL to see if any media was actually saved:

```sql
SELECT * FROM medical_images LIMIT 10;
```

Should show rows with:
- `id` (UUID)
- `clinical_case_id` (should match a diagnosis)
- `file_url` (URL in storage)
- `file_type` (image, video, or link)
- `uploaded_at` (timestamp)

If this returns **0 rows**, media isn't being saved to database.

---

## Step 4: Check Storage Bucket

Go to Supabase → Storage → medical-media

Should see folders like:
```
medical-media/
├── [clinical-case-id-1]/
│   ├── 1699046400000-filename.jpg
│   └── ...
├── [clinical-case-id-2]/
│   └── ...
```

If empty, files aren't uploading to storage.

---

## Step 5: Check Clinical Case ID

Run this SQL:

```sql
SELECT 
  cc.id as case_id,
  p.first_name,
  p.last_name,
  COUNT(mi.id) as media_count
FROM clinical_cases cc
LEFT JOIN patients p ON cc.patient_id = p.id
LEFT JOIN medical_images mi ON cc.id = mi.clinical_case_id
GROUP BY cc.id, p.first_name, p.last_name
ORDER BY cc.id DESC
LIMIT 10;
```

This shows:
- Clinical cases with their IDs
- How many media items attached to each
- Should see at least 1 media_count for your recent upload

---

## Step 6: Verify Query Works

In Supabase SQL Editor, simulate what the app queries:

```sql
-- 1. Get clinical cases for a patient
SELECT id, diagnosis_notes FROM clinical_cases 
WHERE patient_id = '[your-patient-id]'
ORDER BY case_date DESC;

-- 2. For each case above, get media
SELECT * FROM medical_images 
WHERE clinical_case_id = '[the-case-id-from-above]';
```

Both should return results.

---

## Common Issues & Fixes

### Issue 1: "0 rows" in medical_images table

**Diagnosis:** Files uploaded to storage but not to database

**Fix:**
1. Check browser console for errors during upload
2. Verify RLS policies exist (Step 2)
3. Try uploading again
4. Check database after upload

**If still broken:**
```sql
-- Check if RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'medical_images';
-- Should return: true

-- If false, enable RLS
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

-- Then re-run the policy creation SQL
```

---

### Issue 2: Files in storage but not in medical_images table

**Diagnosis:** Upload succeeds but metadata not saved

**Reason:** RLS policy blocking INSERT

**Fix:**
1. Run policy SQL again from `fix-medical-images-rls.sql`
2. Verify 4 policies exist (Step 2)
3. Refresh app and try again

---

### Issue 3: Files in medical_images but not showing on patient page

**Diagnosis:** Database has data but patient page query not working

**Fix:**
1. Clear browser cache: **Ctrl+Shift+Delete**
2. Refresh app: **Ctrl+R**
3. Check browser console (F12) for errors
4. Verify patient ID matches clinical_case patient_id

**Debug SQL:**
```sql
-- Find your patient
SELECT id, first_name, last_name FROM patients 
WHERE first_name = 'YourName' LIMIT 1;

-- Find their clinical cases
SELECT id, diagnosis_notes FROM clinical_cases 
WHERE patient_id = '[patient-id-from-above]';

-- Find media for those cases
SELECT * FROM medical_images 
WHERE clinical_case_id IN (
  SELECT id FROM clinical_cases 
  WHERE patient_id = '[patient-id-from-above]'
);
```

Should return media items.

---

### Issue 4: Browser Shows Error

**If you see in console:**
```
TypeError: clinicalCase.medical_images is undefined
```

→ Query isn't returning medical_images property
→ Check medical_images table exists and has data
→ Try Step 3 SQL query

---

## Complete Diagnostic Checklist

- [ ] Ran: `SELECT policyname FROM pg_policies WHERE tablename = 'medical_images';`
  - Result: 4 rows shown?
  
- [ ] Ran: `SELECT * FROM medical_images LIMIT 10;`
  - Result: Shows uploaded media?
  
- [ ] Checked: Supabase Storage → medical-media bucket
  - Result: Files visible?
  
- [ ] Browser: Opened F12 console
  - Result: Any red errors?
  
- [ ] App: Cleared cache with Ctrl+Shift+Delete
  - Result: Still not showing?
  
- [ ] Database: Verified patient_id matches clinical_case entries
  - Result: Found matching records?

---

## If Still Stuck

Send me:
1. **Error from browser console** (F12)
2. **Results from SQL queries** (Steps 2-5)
3. **Patient name** you're testing with
4. **What you uploaded** (image/video/link)

Then I can give you exact fix.

---

## Quick Test

1. Open Supabase Dashboard
2. Go to Storage → medical-media
3. Do you see any files? 

**YES** → Files uploading ✅
**NO** → Files not uploading ❌

If YES, check Step 3 SQL → media_images table

---

## Nuclear Option (Last Resort)

If nothing works, delete and re-upload:

```sql
-- DELETE all medical images
DELETE FROM medical_images;

-- Verify table is empty
SELECT COUNT(*) FROM medical_images;
-- Should return: 0

-- Then try uploading again in ClinicFlow
```

After uploading, check Step 3 SQL again.

---

**Try the diagnostic steps above and let me know what you find!** 🔍
