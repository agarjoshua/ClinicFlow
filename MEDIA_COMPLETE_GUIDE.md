# 📸 Complete Media Feature Setup & Usage Guide

## Quick Navigation
- [Problem](#-the-error)
- [Fix](#-the-fix-5-minutes)
- [Usage](#-how-to-use-media-feature)
- [Testing](#-test-the-feature)

---

## ⚠️ The Error

```
StorageApiError: Bucket not found
```

**What happened**: The medical-media storage bucket doesn't exist in your Supabase project.

**Where you saw it**: When trying to upload images/videos in the Diagnoses form.

---

## ✅ The Fix (5 Minutes)

### Instructions with Screenshots

#### 1️⃣ Open Supabase Dashboard
Go to: https://app.supabase.com
- Select your ClinicFlow project

#### 2️⃣ Navigate to Storage
- Left sidebar → Click **Storage**
- You'll see a list of existing buckets (if any)

#### 3️⃣ Create New Bucket
- Click **Create a new bucket** button
- A dialog will appear

#### 4️⃣ Fill in Bucket Details
```
Name: medical-media
[ ] Private bucket  (UNCHECK THIS - make it PUBLIC)
```

#### 5️⃣ Set File Limits (Optional)
- File size limit: `104857600` bytes (= 100 MB)
- Allowed MIME types: `image/*, video/*`

#### 6️⃣ Click Create
- Bucket is now created!
- You should see "medical-media" in your bucket list

#### 7️⃣ Back to ClinicFlow App
- Refresh the page (Ctrl+R or Cmd+R)
- **Cache clear recommended**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)

---

## 🎯 How to Use Media Feature

### Uploading Media (Doctor's Workflow)

**Step 1: Go to Diagnoses**
- Click **Diagnoses** tab in navigation

**Step 2: Select a Patient Appointment**
- Click on a patient's appointment from the list
- This opens the diagnosis form

**Step 3: Add Diagnosis Details**
Fill in:
- Chief Complaint (if not filled)
- Neurological Exam findings
- Imaging findings
- Clinical notes
- Treatment plan

**Step 4: Scroll Down to Media Management**
Look for the **Media Management** section with 3 tabs:
- 📷 Image
- 🎬 Video  
- 🔗 Link

**Step 5: Upload Media**

**For Images:**
1. Click the **Image** tab
2. Click "Choose Image" button
3. Select JPG, PNG, or GIF from your computer
4. Add a description (optional): "MRI Brain", "CT Scan", etc.
5. Click **Add Media to Diagnosis**
6. Image appears in list below

**For Videos:**
1. Click the **Video** tab
2. Click "Choose Video" button
3. Select MP4, MOV, or AVI from your computer
4. Add a description (optional): "Patient neurological exam", etc.
5. Click **Add Media to Diagnosis**
6. Video appears in list below

**For Links:**
1. Click the **Link** tab
2. Paste a URL: `https://example.com/medical-resource`
3. Add a description (optional)
4. Click **Add Media to Diagnosis**
6. Link appears in list below

**Step 6: Review Added Media**
- Below the input, you'll see all added media with:
  - 👁️ Eye icon (preview)
  - ✕ X button (remove)

**Step 7: Save Diagnosis**
- Click **Save Diagnosis** button at bottom
- All media uploads automatically
- Database records are created

---

## 👀 Viewing Media (Patient Tab)

### Where to Find Media

**Navigation:**
1. Click **Patients** tab
2. Search for or click on a patient name
3. Scroll down to **Clinical Cases & Diagnoses** section

**What You See:**
- Each diagnosis shows:
  - Diagnosis notes
  - Consultant name & date
  - Symptoms (blue box)
  - Neurological Exam (purple box)
  - Imaging findings (orange box)
  - **Attached Media** section (new!)

**Media Gallery:**
- Grid of media thumbnails
- Each shows:
  - Icon: 📷 image, 🎬 video, or 🔗 link
  - Description text
  - Eye icon on hover

**Viewing Full Media:**
1. Click on any media thumbnail
2. Preview dialog opens showing:
   - **For images**: Full-size photo
   - **For videos**: Playable video with controls
   - **For links**: Clickable URL with "Open Link" button
3. Metadata shown: Type, Category, Filename, Upload date

---

## 🧪 Test the Feature

### Quick Test (2 minutes)

**Setup Phase:**
- ✅ Create `medical-media` bucket in Supabase
- ✅ Refresh app
- ✅ Clear browser cache

**Test Phase:**
1. Go to **Diagnoses** tab
2. Find a patient appointment (or create one)
3. Fill in diagnosis form
4. Upload a test image:
   - Take a screenshot or use any JPG/PNG
   - Scroll to Media Management → Image tab
   - Upload the file
   - Add description: "Test Image"
   - Click "Add Media to Diagnosis"
5. Save the diagnosis
6. Go to **Patients** tab
7. Open the same patient
8. Scroll to **Clinical Cases**
9. Should see your test image in the media gallery!
10. Click it to preview

---

## 📋 Media Management Features

### What the System Does

| Feature | What It Does |
|---------|-------------|
| **Automatic Upload** | Files upload to Supabase storage automatically |
| **URL Generation** | System generates public URLs for viewing |
| **Database Tracking** | All media metadata stored in `medical_images` table |
| **Patient Linking** | Media linked to specific diagnoses → linked to patient |
| **Preview Display** | Thumbnails in gallery, full preview in dialog |
| **Metadata Stored** | File type, name, description, upload date, uploader tracked |

### File Organization in Storage

```
medical-media/
└── [clinical-case-id]/
    ├── 1699046400000-scan1.jpg
    ├── 1699046401000-video1.mp4
    └── 1699046402000-notes.pdf
```

Files organized by clinical case ID for easy management.

---

## 🔧 Technical Details

### Database Table: medical_images

```sql
CREATE TABLE medical_images (
  id UUID PRIMARY KEY,
  clinical_case_id UUID NOT NULL,  -- Links to diagnosis
  file_type TEXT,                  -- 'image', 'video', 'link'
  image_type TEXT,                 -- 'MRI', 'CT', 'Photo', etc.
  file_url TEXT NOT NULL,          -- URL to file in storage
  file_name TEXT,                  -- Original filename
  description TEXT,                -- User description
  uploaded_by UUID,                -- Who uploaded
  uploaded_at TIMESTAMP            -- When uploaded
);
```

### Storage Bucket: medical-media

```
Type: Public (anyone with URL can view)
MIME Types: image/*, video/*
Max File Size: 100 MB per file
Max Storage: 5 GB (Supabase free tier)
```

---

## ❓ FAQ

**Q: Can I upload files larger than 100MB?**
A: No, max is 100MB per file. Adjust in bucket settings if needed.

**Q: What formats are supported?**
A: Images (JPG, PNG, GIF), Videos (MP4, MOV, AVI), Links (any URL).

**Q: Where are files stored?**
A: In Supabase storage bucket `medical-media`, organized by clinical case ID.

**Q: Can patients see their own media?**
A: Currently only consultants/staff can view. Can add patient portal later.

**Q: What if I delete a diagnosis?**
A: Media files remain in storage but database record is deleted.

**Q: Can I download media?**
A: Videos and links have download functionality. Images can be right-click saved.

**Q: How much storage do I get?**
A: 5GB free with Supabase. About 1000-2000 patient scans.

---

## 🚀 Next Steps

After completing this setup:

1. ✅ Create storage bucket
2. ✅ Test with sample media
3. ✅ Start uploading patient scans
4. ✅ View in patient profiles
5. 🎯 Next: Post-op monitoring page (next feature)

---

## 📞 Support

If you encounter issues:

1. **Check bucket exists**: Storage → confirm `medical-media` listed
2. **Clear cache**: Ctrl+Shift+Delete
3. **Check logs**: Browser console (F12) for error details
4. **Verify Supabase credentials**: `.env` file has correct URL and keys
5. **Test database**: SQL Editor → `SELECT * FROM medical_images;`

---

**You're all set! 🎉 Enjoy managing medical media in ClinicFlow!**
