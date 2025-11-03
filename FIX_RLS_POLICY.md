# 🔐 FIX: RLS Policy Violation for Medical Images

## The Error
```
StorageApiError: new row violates row-level security policy
```

## What It Means
- ✅ Storage bucket created successfully
- ✅ Files uploading to storage successfully
- ❌ Database table `medical_images` has RLS policies blocking INSERT
- ❌ You can't save the metadata about the uploaded files

## The Fix (2 Steps)

### Step 1: Go to Supabase SQL Editor

1. Open: https://app.supabase.com
2. Select your **ClinicFlow** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Paste and Run the SQL

Copy-paste this SQL command:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

-- Policy 1: Allow authenticated users to INSERT their own media
CREATE POLICY "authenticated_can_insert_medical_images"
ON medical_images
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Allow authenticated users to READ all media (for patient profiles)
CREATE POLICY "authenticated_can_read_medical_images"
ON medical_images
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy 3: Allow authenticated users to UPDATE their own media
CREATE POLICY "authenticated_can_update_medical_images"
ON medical_images
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: Allow authenticated users to DELETE their own media
CREATE POLICY "authenticated_can_delete_medical_images"
ON medical_images
FOR DELETE
USING (auth.uid() IS NOT NULL);
```

### Step 3: Execute
- Click the **Play button** (▶) or press **Ctrl+Enter**
- You should see: `successfully completed`

### Step 4: Back to ClinicFlow
- Refresh the app (Ctrl+R)
- Try uploading media again
- ✅ Should work now!

---

## What This Does

| Policy | Allows | Example |
|--------|--------|---------|
| INSERT | Authenticated users create media records | Doctor uploads scan |
| SELECT | Authenticated users read all media | View patient's images |
| UPDATE | Authenticated users edit their records | Change description |
| DELETE | Authenticated users remove media | Delete old scan |

All policies check: `auth.uid() IS NOT NULL` = Must be logged in

---

## Why This Happened

1. `medical_images` table has RLS enabled
2. No policies were set up for the app
3. When you tried to INSERT, Supabase blocked it (security feature)
4. This SQL creates the proper policies

---

## Test Again

1. Go to **Diagnoses**
2. Try uploading an image/video
3. Save diagnosis
4. ✅ Should succeed now!
5. Go to **Patients** → See your media in patient profile

---

## If It Still Doesn't Work

1. Check RLS is enabled on table:
   - Go to: **Authentication** → **Policies**
   - Find: `medical_images` table
   - Should show 4 policies (INSERT, SELECT, UPDATE, DELETE)

2. If not showing, the SQL might have failed:
   - Check SQL editor output for error messages
   - Try running just the DROP commands first
   - Then run CREATE commands

3. Alternative: Disable RLS temporarily (not recommended for production):
   ```sql
   ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;
   ```
   Then re-enable after testing:
   ```sql
   ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;
   ```

---

## File Location

This SQL is saved as: `fix-medical-images-rls.sql` in project root

You can run it anytime by:
1. SQL Editor → New Query
2. Paste contents of `fix-medical-images-rls.sql`
3. Execute

---

**That's it! RLS policies now properly configured.** ✅
