# 🎯 MEDIA UPLOAD FIX - Storage Bucket Setup

## The Problem
```
StorageApiError: Bucket not found
```

This error occurs because the `medical-media` storage bucket hasn't been created in your Supabase project yet.

## The Solution (3 Easy Steps)

### Step 1: Go to Supabase Dashboard
Visit: https://app.supabase.com

### Step 2: Create the Storage Bucket
1. Select your ClinicFlow project
2. Click **Storage** (left sidebar)
3. Click **Create a new bucket**
4. Fill in:
   - **Name**: `medical-media`
   - **Public bucket**: Toggle **ON** ✓
   - **File size limit**: `104857600` (100MB)

### Step 3: Refresh and Test
1. Refresh your ClinicFlow app in the browser
2. Go to **Diagnoses** page
3. Try uploading an image/video or adding a link
4. Create a diagnosis with media
5. Go to **Patients** tab
6. Open a patient → You should now see the media in the **Clinical Cases** section!

---

## What Each Field Does

| Field | Value | Purpose |
|-------|-------|---------|
| **Bucket Name** | `medical-media` | Where all medical images/videos are stored |
| **Public Bucket** | ON | Anyone with the URL can view (needed for displaying media) |
| **File Size Limit** | 100MB | Maximum file size per upload |
| **MIME Types** | image/*, video/* | Accept all image and video formats |

---

## After Setup - Expected Workflow

### For Doctors/Consultants:
1. Go to **Diagnoses** tab
2. Select a patient appointment
3. Click **Add Diagnosis**
4. Scroll to **Media Management** section
5. Choose: Image, Video, or Link
6. Upload/add media
7. Add description (optional)
8. Click **Add Media to Diagnosis**
9. **Save Diagnosis** - media uploads to Supabase storage

### For Viewing Media:
1. Go to **Patients** tab
2. Click on a patient name
3. Scroll to **Clinical Cases & Diagnoses**
4. See all diagnoses with **Attached Media** grid
5. Click any media thumbnail to preview

---

## Troubleshooting

### Media still shows error after creating bucket?
- **Clear cache**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- **Refresh page**: F5 or Cmd+R
- **Check bucket exists**: Go back to Storage tab, confirm `medical-media` is listed

### Media uploads but doesn't show on patient page?
1. Verify the `medical_images` table exists:
   - Go to **SQL Editor** in Supabase
   - Run: `SELECT * FROM medical_images LIMIT 1;`
   - If error, check that migrations ran correctly

2. Check browser console for errors:
   - Press F12 (Developer Tools)
   - Look for red errors in Console tab

### File uploads but link shows broken?
- Ensure bucket is **Public** (public bucket toggle ON)
- File permissions should allow public read

---

## Video Files Support

The system supports:
- **Images**: JPG, PNG, GIF (viewable in ClinicFlow)
- **Videos**: MP4, MOV, AVI (playable in ClinicFlow)
- **Links**: Any URL (opens in new tab)

---

## Storage Costs

Supabase includes **5GB free storage**. Medical files:
- Average image: 2-5 MB
- Average video: 50-200 MB
- Average link: 0 MB (just stores URL)

With 5GB limit, you can store ~25-50 full-resolution MRI scans or ~100 patient photos.

---

## Need Help?

If you still have issues:
1. Check Supabase project settings are correct in `.env`
2. Verify you're logged into Supabase with correct account
3. Check browser console (F12) for detailed error messages
4. Review: `FIX_MEDIA_BUCKET.md` in project root

---

**✅ Once bucket is created, you're all set!**

The app will automatically:
- Upload files to `medical-media` bucket
- Store metadata in `medical_images` database table
- Display thumbnails in patient clinical cases
- Show full preview when clicked

Enjoy your clinic management system! 🏥
