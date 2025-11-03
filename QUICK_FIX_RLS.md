# 🔥 QUICK FIX #2: RLS Policy Error

## The Error
```
new row violates row-level security policy
```

## What It Means
Database is blocking inserts (security feature, but we need to allow it)

## The One-Minute Fix

### Step 1: Go to SQL Editor
https://app.supabase.com → Your Project → SQL Editor → New Query

### Step 2: Paste This
```sql
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

CREATE POLICY "authenticated_can_insert_medical_images"
ON medical_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_read_medical_images"
ON medical_images FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_update_medical_images"
ON medical_images FOR UPDATE USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_delete_medical_images"
ON medical_images FOR DELETE USING (auth.uid() IS NOT NULL);
```

### Step 3: Execute
Click ▶ button

### Step 4: Refresh App
Ctrl+R in ClinicFlow

## Done! ✅

Now media uploads will work.

---

Need detailed instructions?
→ Read: `COMPLETE_RLS_FIX_GUIDE.md`
