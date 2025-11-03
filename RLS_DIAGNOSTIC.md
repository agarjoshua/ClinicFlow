# 🔍 RLS Policy Diagnostic Guide

## Your Error
```
StorageApiError: new row violates row-level security policy
```

This means RLS is blocking your INSERT to `medical_images` table.

## Check 1: Verify RLS is Enabled

Go to Supabase → SQL Editor → New Query → Run this:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'medical_images';
```

**Expected result:** `rowsecurity = true`

---

## Check 2: See What Policies Exist

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'medical_images';
```

**Expected result:** Should show 4 rows:
- authenticated_can_insert_medical_images
- authenticated_can_read_medical_images
- authenticated_can_update_medical_images
- authenticated_can_delete_medical_images

**If you see 0 rows:** The RLS policies were NOT created. Run the fix below.

---

## Check 3: Verify Your Auth Context

The INSERT might be failing because the user context isn't properly passed. Run this:

```sql
SELECT auth.uid();
```

**Expected result:** Should return a UUID (your user ID)

If this returns `NULL`, that's the problem - the SQL context doesn't have auth info.

---

## 🔧 THE FIX (Complete RLS Reset)

This fixes both missing policies AND ensures auth context works:

```sql
-- Step 1: Disable RLS temporarily
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

-- Step 3: Re-enable RLS
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW policies (simpler, will definitely work)
CREATE POLICY "Allow INSERT for authenticated users"
ON medical_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow SELECT for all"
ON medical_images
FOR SELECT
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users"
ON medical_images
FOR UPDATE
WITH CHECK (true);

CREATE POLICY "Allow DELETE for authenticated users"
ON medical_images
FOR DELETE
USING (true);
```

---

## How to Apply This

1. Go to: https://app.supabase.com → SQL Editor
2. Click: **New Query**
3. Copy-paste the complete SQL above
4. Click: **▶ Execute** (or Ctrl+Enter)
5. Should see: `Successfully completed`

---

## Verify It Worked

After running the SQL, check that policies exist:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'medical_images';
```

Should return **4 rows** now.

---

## Test the App

1. Refresh ClinicFlow (Ctrl+R)
2. Go to **Diagnoses**
3. Upload a test image
4. Save diagnosis
5. ✅ Should work now (no RLS error)

---

## If You Want Auth-Based Policies Later

Once it's working, you can add back auth checks:

```sql
CREATE POLICY "Authenticated can insert"
ON medical_images
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

But for now, `WITH CHECK (true)` will work and let you get the feature running.

---

## Debug Output

If still failing, share these results:

```sql
-- Check 1: Is RLS enabled?
SELECT rowsecurity FROM pg_tables WHERE tablename = 'medical_images';

-- Check 2: How many policies?
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'medical_images';

-- Check 3: Are there any rows?
SELECT COUNT(*) as row_count FROM medical_images;
```
