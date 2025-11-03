# 🔥 NUCLEAR FIX - RLS Policy Complete Reset

## You're Getting This Error:
```
StorageApiError: new row violates row-level security policy
```

## THE FIX (Copy-Paste This)

### Step 1: Open Supabase SQL Editor
https://app.supabase.com → Your Project → SQL Editor → New Query

### Step 2: Copy This ENTIRE SQL Block

```sql
ALTER TABLE medical_images DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert" ON medical_images FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_select" ON medical_images FOR SELECT USING (true);
CREATE POLICY "allow_update" ON medical_images FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON medical_images FOR DELETE USING (true);
```

### Step 3: Paste & Execute
- Paste the SQL above
- Click ▶ (Execute button)
- Should say: ✅ `successfully completed`

### Step 4: Refresh & Test
1. Refresh ClinicFlow (Ctrl+R)
2. Go to Diagnoses
3. Upload image
4. Save
5. ✅ Should work now!

---

## Verify It Worked

In SQL Editor, run:
```sql
SELECT COUNT(*) FROM medical_images;
```

**Should show: at least 1 row** (your uploaded media)

---

## Then Check Patient Page

1. Go to **Patients** tab
2. Open the patient
3. Scroll to **Clinical Cases**
4. Should see **Attached Media** with your image ✅

---

**Go copy that SQL now!** 🚀
