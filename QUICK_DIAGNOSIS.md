# 🚨 QUICK DIAGNOSIS: Media Uploaded But Not Showing

## First: Clear Cache & Refresh

1. Press: **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select: **Cached images and files** ✓
3. Click: **Clear data**
4. Refresh: **Ctrl+R** or **Cmd+R**

**Try uploading again - does it show now?**

---

## If Still Not Showing

### Check 1: Is media actually in database?

Go to: https://app.supabase.com → SQL Editor → New Query

Paste:
```sql
SELECT * FROM medical_images LIMIT 10;
```

**Results:**
- ✅ Shows rows? → Media IS saved, just not displaying (go to Check 2)
- ❌ Shows 0 rows? → Media NOT saving to database (go to Check 3)

---

### Check 2: If media IS in database but not showing

**Problem:** Query issue on patient page

**Solution:**
```sql
-- Find your patient ID
SELECT id FROM patients WHERE first_name = 'FirstName' LIMIT 1;

-- Get that patient's clinical cases
SELECT id FROM clinical_cases WHERE patient_id = '[patient-id-from-above]' LIMIT 1;

-- Get media for that case
SELECT * FROM medical_images WHERE clinical_case_id = '[case-id-from-above]';
```

**If this shows media rows, but patient page doesn't show:**
1. Clear cache again (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Close and reopen app

---

### Check 3: If media NOT in database

**Problem:** RLS policies blocking INSERT

**Solution:** Re-run the RLS policy SQL

Go to: https://app.supabase.com → SQL Editor → New Query

Paste:
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

Execute (click ▶)

Then:
1. Refresh ClinicFlow
2. Try uploading again
3. Check database for media

---

## Open Browser Console

Press: **F12** (Developer Tools)

Click: **Console** tab

**Any red errors?** Share them and I'll tell you the fix.

---

## What I Need From You

To help debug, tell me:

1. **Did you clear cache?** Y/N
2. **Check 1 result:** Rows shown or 0 rows?
3. **Any console errors?** (F12 → Console)
4. **File uploaded:** Image/Video/Link?
5. **Patient name:** Testing with?

---

**Start with: Clear cache + Refresh, then tell me results!**
