# ✅ FIXED: Database Column Name Mismatch

## The Problem

You were getting error:
```
null value in column "image_url" of medical_images violates not null constraints
```

## Root Cause

The **database column is named `image_url`** but the code was trying to insert into `file_url`.

Schema mismatch:
- **Code was using:** `file_url` ❌
- **Database expects:** `image_url` ✅

## What I Fixed

Changed all occurrences of `file_url` to `image_url` in:

### 1. diagnoses.tsx (line 286)
```typescript
// BEFORE
file_url: fileUrl,

// AFTER
image_url: fileUrl, // Changed from file_url to image_url
```

### 2. patient-detail.tsx
- **Insert statement** (line 331): `file_url` → `image_url`
- **Delete query** (line 367): `select("file_url")` → `select("image_url")`
- **Delete logic** (line 371): `media.file_url` → `media.image_url`
- **Display references** (4 locations): All `media.file_url` → `media.image_url`
- **Primary thumbnail** (line 947): `file_url` → `image_url`
- **Gallery thumbnails** (line 1080): `file_url` → `image_url`  
- **MediaViewDialog** (3 locations): All `media.file_url` → `media.image_url`

## Now What?

### 1. Make Sure RLS Policies Are Applied
You still need to run the SQL from `COMPLETE_STORAGE_FIX.sql`:
```bash
Go to Supabase → SQL Editor → Paste SQL → Execute
```

### 2. Test Upload Again
1. Refresh ClinicFlow (Ctrl+R)
2. Go to Diagnoses
3. Upload an image
4. Save diagnosis
5. ✅ Should work now (no "null value" error)

### 3. Verify Data Saved
```sql
SELECT * FROM medical_images ORDER BY uploaded_at DESC LIMIT 5;
```

Should show your uploaded image with:
- `image_url` = https://...supabase.co/storage/.../filename.jpg
- `file_type` = 'image'
- `file_name` = 'download.jpeg'
- etc.

### 4. Check Patient Page
1. Go to Patients
2. Click patient
3. Scroll to Clinical Cases
4. ✅ Image should appear beside diagnosis!

## Why This Happened

The schema.ts file defined the column as `fileUrl` (camelCase), but Supabase/Drizzle converts this to `file_url` (snake_case) in the migration. However, it seems the actual database has `image_url` instead - possibly from a manual migration or schema update.

## Summary

✅ Fixed all `file_url` → `image_url` references  
⏳ Still need to run RLS policy SQL  
⏳ Then re-upload to test

**After running the SQL, uploads should work and images will display!** 🎉
