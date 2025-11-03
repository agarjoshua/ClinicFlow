# 🎯 WHY YOU CAN'T SEE IMAGES - Simple Explanation

## What's Happening

```
You upload image → File goes to storage ✅ → You can see it in bucket ✅
                                           ↓
                              Try to save metadata to database ❌
                                           ↓
                              RLS POLICY BLOCKS IT ❌
                                           ↓
                              medical_images table = 0 rows ❌
                                           ↓
                              Patient page queries table → finds nothing ❌
                                           ❌ NO IMAGES DISPLAYED
```

## The Fix in 3 Steps

### 1️⃣ Go to Supabase SQL Editor
https://app.supabase.com → SQL Editor → New Query

### 2️⃣ Copy-Paste This COMPLETE SQL

```sql
-- STORAGE POLICIES
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

-- DATABASE TABLE POLICIES
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

### 3️⃣ Click Execute (▶ button)

Wait for: "Successfully completed"

---

## After Running SQL

### Check It Worked:
```sql
SELECT COUNT(*) FROM medical_images;
```
- **Before:** Returns 0
- **After:** Still 0 (old uploads aren't in database)

### Upload New Image:
1. Go to ClinicFlow → Diagnoses
2. Upload an image to any diagnosis
3. Save
4. Run: `SELECT COUNT(*) FROM medical_images;`
5. **Should now return:** 1

### View on Patient Page:
1. Go to Patients
2. Click patient
3. Scroll to Clinical Cases
4. ✅ **IMAGE APPEARS!**

---

## Important Notes

⚠️ **Old uploads won't show** - Images uploaded BEFORE running the SQL are only in storage, not in database. You need to re-upload them.

✅ **New uploads will work** - After running SQL, all new uploads will save to both storage AND database, and will display on patient pages.

---

## What the SQL Does

Creates 8 policies:
- 4 for `storage.objects` (allows file uploads)
- 4 for `medical_images` (allows database inserts)

Without these policies, Supabase blocks all access (security feature).

---

**Go run that SQL now!** 🚀
