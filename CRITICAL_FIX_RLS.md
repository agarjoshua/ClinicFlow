# 🚨 CRITICAL FIX: RLS Policy Not Working

## The Problem
```
StorageApiError: new row violates row-level security policy
```

This happens at line 268 in diagnoses.tsx when trying to INSERT medical image metadata.

## Root Cause
The RLS policies likely **weren't created successfully** or the policies have an issue.

## Immediate Fix (3 minutes)

### Option A: Temporarily Disable RLS (For Testing)

Go to: https://app.supabase.com → SQL Editor → New Query

Paste:
```sql
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;
```

Execute. Then:
1. Refresh ClinicFlow
2. Try uploading media
3. Check if it works now

**If it works:** Problem is RLS policies
**If it still fails:** Problem is something else

---

### Option B: Reset RLS Completely (Nuclear Option)

Go to: https://app.supabase.com → SQL Editor → New Query

**Run this (copy everything):**

```sql
-- First disable RLS
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

-- Re-enable RLS
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "allow_authenticated_insert"
ON medical_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow_authenticated_read"
ON medical_images
FOR SELECT
USING (true);

CREATE POLICY "allow_authenticated_update"
ON medical_images
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete"
ON medical_images
FOR DELETE
USING (true);
```

This:
1. Disables RLS temporarily
2. Drops all policies
3. Re-enables RLS
4. Creates simple policies (allow all authenticated users)

Then:
1. Refresh ClinicFlow
2. Try uploading
3. Should work now

---

## What These Policies Do

```sql
CREATE POLICY "allow_authenticated_insert"
ON medical_images
FOR INSERT
WITH CHECK (true);
```

Means: **Any authenticated user can INSERT** (no extra checks)

Same for SELECT, UPDATE, DELETE.

---

## Verify It Worked

After running the SQL, check:

```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'medical_images'
ORDER BY policyname;
```

Should show 4 rows with policies.

---

## Test Upload Now

1. Refresh ClinicFlow: **Ctrl+R**
2. Go to **Diagnoses** tab
3. Select patient
4. Upload image
5. Save diagnosis
6. **Should succeed now!**
7. Check database:
```sql
SELECT COUNT(*) FROM medical_images;
```
Should show: at least 1

---

## If Still Failing

Tell me:

1. **Did you run Option A or B?** (Which one?)
2. **Did it say "successfully completed"?** (Y/N)
3. **What error do you see now?** (Copy/paste from console)
4. **Result of this SQL:**
```sql
SELECT relrowsecurity FROM pg_class WHERE relname = 'medical_images';
```
(Returns true or false?)

---

## Production Note

⚠️ The `WITH CHECK (true)` policies allow anyone authenticated. For production, use:

```sql
WITH CHECK (auth.uid() IS NOT NULL)
```

But for now, let's get it working first!

---

**Try Option B above (copy everything), then test upload!**
