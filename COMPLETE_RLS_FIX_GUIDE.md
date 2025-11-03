# 🎯 Complete Fix: RLS Policy + Media Upload

## Progress So Far ✅
- ✅ Step 1: Created `medical-media` storage bucket
- ✅ Step 2: Files uploading to storage successfully
- ❌ Step 3: RLS policy blocking database inserts

## Now: Fix RLS Policies (2 minutes)

### Visual Guide

**Error You're Seeing:**
```
StorageApiError: new row violates row-level security policy
```

**What's Happening:**
```
1. You upload image ✓
2. Image goes to storage ✓
3. App tries to save metadata to DB ✗ BLOCKED by RLS
4. Metadata table (medical_images) has strict RLS
5. No policies allow your user to INSERT
```

### The Fix

#### Option A: Using Supabase Dashboard (Recommended)

**1. Go to SQL Editor:**
- https://app.supabase.com → Your project → SQL Editor

**2. Create New Query:**
- Click **New Query** button

**3. Copy This SQL:**
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_can_insert_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_read_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_update_medical_images" ON medical_images;
DROP POLICY IF EXISTS "authenticated_can_delete_medical_images" ON medical_images;

-- Create policies for authenticated users
CREATE POLICY "authenticated_can_insert_medical_images"
ON medical_images FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_read_medical_images"
ON medical_images FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_update_medical_images"
ON medical_images FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_delete_medical_images"
ON medical_images FOR DELETE
USING (auth.uid() IS NOT NULL);
```

**4. Execute:**
- Click ▶ button or press Ctrl+Enter

**5. Success:**
- Should see: ✅ `successfully completed`
- You should see output showing policies created

---

## What These Policies Do

```
Medical Images Table (RLS Protected)
├── INSERT Policy: ✓ If user logged in
├── SELECT Policy: ✓ If user logged in
├── UPDATE Policy: ✓ If user logged in
└── DELETE Policy: ✓ If user logged in
```

**Security**: Users can only access data if authenticated
**Flexibility**: All authenticated users can insert/read/update/delete

---

## Test After Fix

### Quick Test (1 minute)

1. **Go to Diagnoses**
   - Click Diagnoses tab

2. **Add Diagnosis with Media**
   - Find any patient appointment
   - Click to open
   - Scroll to Media Management
   - Upload a test image
   - Click "Add Media to Diagnosis"
   - Click "Save Diagnosis"

3. **Expected Result:**
   - ✅ Success notification appears
   - ✅ No error messages

4. **Verify Media**
   - Go to Patients tab
   - Find the same patient
   - Scroll to Clinical Cases
   - Should see the image in Attached Media grid
   - Click to preview

---

## Troubleshooting

### Error: "Table medical_images does not exist"
→ The migration didn't run. Check that `medical_images` table exists:
```sql
SELECT * FROM medical_images LIMIT 1;
```

### Error: "permission denied for schema public"
→ You need Supabase role that can create policies. Use your project owner account.

### Error: "column auth.uid() does not exist"
→ Supabase auth functions not available. Refresh and try again.

### Still can't insert after running SQL?
1. Verify policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'medical_images';
   ```
   Should show 4 rows for INSERT, SELECT, UPDATE, DELETE

2. Check RLS is enabled on table:
   ```sql
   SELECT relrowsecurity FROM pg_class WHERE relname = 'medical_images';
   ```
   Should return: `true`

3. If RLS not enabled:
   ```sql
   ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;
   ```

---

## Complete Flow After Fix

```
Diagnoses Page
├── Upload Image/Video/Link
├── Add Media to Diagnosis ✓
├── Save Diagnosis ✓
│   ├── File → Supabase Storage ✓
│   └── Metadata → medical_images Table ✓
│
Patient Detail Page
├── View Patient
├── Scroll to Clinical Cases ✓
├── See Attached Media ✓
├── Click Thumbnail
├── Preview Dialog Opens ✓
│   ├── Image: Full-size view
│   ├── Video: Playable with controls
│   └── Link: Clickable URL
```

---

## Next Steps

### Immediate
1. ✅ Run the SQL to create RLS policies
2. ✅ Refresh ClinicFlow app
3. ✅ Test media upload

### After Testing
- [ ] Upload real patient scans
- [ ] Share with team
- [ ] Start clinic operations
- [ ] Proceed to Post-Op page (next feature)

---

## Reference Files

| File | Purpose |
|------|---------|
| `fix-medical-images-rls.sql` | SQL commands for RLS policies |
| `FIX_RLS_POLICY.md` | This detailed guide |
| `MEDIA_COMPLETE_GUIDE.md` | Full feature documentation |
| `QUICK_FIX.md` | 1-minute quick reference |

---

## Support

**Can't run SQL?**
→ Try copying text from: `fix-medical-images-rls.sql`

**Not sure if it worked?**
→ Run this check in SQL Editor:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'medical_images' ORDER BY policyname;
```

Should show 4 rows with policies: authenticated_can_insert, authenticated_can_read, authenticated_can_update, authenticated_can_delete

---

**Once this SQL runs, media uploads will work!** ✅
