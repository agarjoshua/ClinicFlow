# 🔍 DEBUG: Media Not Saving to Database

## Problem
- ✅ Files upload to storage (you see "Success")
- ❌ Database shows 0 rows (metadata not saving)

## Root Cause
RLS policy is STILL blocking the INSERT

## Verify RLS Policies Exist

Go to: https://app.supabase.com → SQL Editor → New Query

Paste:
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'medical_images' 
ORDER BY policyname;
```

**Expected result: 4 rows**
- authenticated_can_delete_medical_images | DELETE
- authenticated_can_insert_medical_images | INSERT
- authenticated_can_read_medical_images   | SELECT
- authenticated_can_update_medical_images | UPDATE

**Your result: ??**

If you see 0 rows or less than 4 rows → **Policies weren't created**

---

## If Policies Don't Exist

### Step 1: Run the SQL AGAIN

Go to: https://app.supabase.com → SQL Editor → New Query

**Paste THIS ENTIRE THING** (copy everything):

```sql
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

CREATE POLICY "authenticated_can_insert_medical_images"
ON medical_images
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_read_medical_images"
ON medical_images
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_update_medical_images"
ON medical_images
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_delete_medical_images"
ON medical_images
FOR DELETE
USING (auth.uid() IS NOT NULL);
```

### Step 2: Click Execute (▶ button)

**You should see:** `successfully completed`

**If you see error messages**, tell me what they say!

### Step 3: Verify Policies Created

Run this:
```sql
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'medical_images';
```

Should show: `4`

If not 4, the SQL failed. Check for error messages.

### Step 4: Refresh App & Try Again

- Refresh ClinicFlow: **Ctrl+R**
- Go to **Diagnoses**
- Upload test image
- Save diagnosis
- Check database again:
```sql
SELECT * FROM medical_images LIMIT 10;
```

Should now show rows!

---

## If Policies Exist But Still Not Working

Run this diagnostic:

```sql
-- Check if RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'medical_images';
```

Should return: `true`

**If returns FALSE:**
```sql
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;
```

Then run the policy creation SQL again.

---

## Alternative Fix: Check Table Permissions

```sql
-- Check table owner
SELECT schemaname, tablename, tableowner FROM pg_tables 
WHERE tablename = 'medical_images';

-- Check column permissions
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'medical_images'
LIMIT 5;
```

Should show table exists and has columns.

---

## Last Resort: Disable RLS Temporarily (For Testing)

⚠️ **WARNING: Not recommended for production, but good for testing**

```sql
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;
```

Then:
1. Refresh app
2. Try uploading
3. Check database: `SELECT * FROM medical_images LIMIT 10;`

**If NOW it shows rows:**
- Problem is RLS policies
- Re-enable and fix policies:
```sql
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;
```

---

## Send Me:

1. **Result of:**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'medical_images';
```
How many rows? (Should be 4)

2. **Result of:**
```sql
SELECT relrowsecurity FROM pg_class WHERE relname = 'medical_images';
```
Returns true or false?

3. **Any error messages** from running the CREATE POLICY SQL

With this info I can tell you the exact fix!
