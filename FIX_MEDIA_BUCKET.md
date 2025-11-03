# Fix: Create Medical-Media Storage Bucket in Supabase

The error **"Bucket not found"** means the `medical-media` storage bucket doesn't exist in your Supabase project.

## Quick Fix - Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter bucket name: `medical-media`
5. Toggle **Public bucket** to **ON**
6. Set allowed MIME types:
   - `image/*` (all image types)
   - `video/mp4`
   - `video/quicktime`
   - `video/x-msvideo`
7. Set file size limit: **100 MB**
8. Click **Create bucket**

## Programmatic Setup

If you want to create it via code, run:

```bash
# First, make sure you have the service role key (from Supabase Settings → API)
# Then set it as an environment variable:
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the setup script
node setup-storage.js
```

## What Gets Created

A public storage bucket named `medical-media` that can store:
- Medical images (JPG, PNG, GIF)
- Medical videos (MP4, MOV, AVI)
- Patient documentation (PDF)
- Maximum file size: 100MB per file

## RLS Policies (if needed)

The bucket is public by default, so anyone can read files. For authenticated-only access, add RLS policies:

1. Go to Storage → Policies
2. Add a policy allowing authenticated users to upload/read

## Testing

After creating the bucket:

1. Go to **Diagnoses** page
2. Create a new diagnosis
3. Try uploading an image/video or linking a file
4. The media should now be visible on the patient detail page

## Troubleshooting

If you still see the error after creating the bucket:

1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Refresh the page (F5 or Cmd+R)
3. Check Supabase dashboard → Storage to confirm bucket exists
4. Check browser console for full error message

If the media uploads but doesn't appear on patient page:
- Verify medical_images table exists: Go to SQL Editor and run:
  ```sql
  SELECT * FROM medical_images LIMIT 1;
  ```
- Make sure clinical_case_id matches existing clinical_cases.id
