# Demo Clinic Seed Data - Step-by-Step Guide

This guide will help you create a fully populated demo clinic for ZahaniFlow with 30 patients, 3 hospitals, and clinic sessions.

## Prerequisites
- Access to Supabase SQL Editor
- Access to Supabase Authentication Dashboard

## Step-by-Step Instructions

### STEP 1: Create the Clinic
1. Open Supabase SQL Editor
2. Run `seed_demo_clinic_step1_clinic.sql`
3. **Copy the returned clinic ID** (it will look like: `12345678-1234-1234-1234-123456789abc`)
4. Save this ID - you'll need it for all subsequent steps

### STEP 2: Create Auth Users and Profile Users
1. Go to Supabase **Authentication > Users**
2. Click "Add User" and create:
   - **Email:** `demo.consultant@zahaniflow.com`
   - **Password:** `DemoConsultant2025!`
   - **Auto Confirm:** Yes
3. Click "Add User" again and create:
   - **Email:** `demo.assistant@zahaniflow.com`
   - **Password:** `DemoAssistant2025!`
   - **Auto Confirm:** Yes
4. Copy both users' **UUID** values from the auth.users table
5. Open `seed_demo_clinic_step2_users.sql`
6. **Replace the following placeholders:**
   - `YOUR_CONSULTANT_AUTH_UID` → Consultant's auth UUID
   - `YOUR_ASSISTANT_AUTH_UID` → Assistant's auth UUID
   - `YOUR_CLINIC_ID_FROM_STEP1` → Clinic ID from step 1 (appears 3 times)
7. Run the modified script in SQL Editor
8. **Copy the consultant's public users.id** from the first RETURNING statement
9. Replace `YOUR_CONSULTANT_PUBLIC_ID` in the UPDATE statement at the bottom
10. Run the UPDATE statement separately if needed

### STEP 3: Create Hospitals
1. Open `seed_demo_clinic_step3_hospitals.sql`
2. **Replace:** `YOUR_CLINIC_ID_FROM_STEP1` → Clinic ID from step 1 (appears 3 times)
3. Run the modified script in SQL Editor
4. **Copy all 3 hospital IDs** from the RETURNING statement:
   - Hospital 1 (KNH-DEMO)
   - Hospital 2 (AKUH-DEMO)
   - Hospital 3 (NH-DEMO)

### STEP 4: Create 30 Demo Patients
1. Open `seed_demo_clinic_step4_patients.sql`
2. **Replace the following placeholders:**
   - `YOUR_CLINIC_ID_FROM_STEP1` → Clinic ID from step 1 (appears 30 times)
   - `YOUR_HOSPITAL_1_ID` → First hospital ID from step 3 (appears 2 times - for inpatients)
   - `YOUR_HOSPITAL_2_ID` → Second hospital ID from step 3 (appears 1 time - for inpatient)
3. Run the modified script in SQL Editor
4. This creates 30 diverse patients with various neurosurgery conditions

### STEP 5: Create Clinic Sessions
1. Open `seed_demo_clinic_step5_sessions.sql`
2. **Replace the following placeholders:**
   - `YOUR_HOSPITAL_1_ID` → First hospital ID from step 3 (appears 5 times)
   - `YOUR_HOSPITAL_2_ID` → Second hospital ID from step 3 (appears 2 times)
   - `YOUR_HOSPITAL_3_ID` → Third hospital ID from step 3 (appears 2 times)
   - `YOUR_CONSULTANT_PUBLIC_ID` → Consultant's public users.id from step 2 (appears 10 times)
3. Run the modified script in SQL Editor
4. This creates 10 clinic sessions (5 completed, 1 today, 4 upcoming)

## What You'll Have After Completion

✓ **1 Demo Clinic:** Nairobi Neurosurgery Center - Demo
✓ **2 Users:**
  - Dr. Sarah Mwangi (Consultant/Owner)
  - Jane Kamau (Assistant)
✓ **3 Hospitals:**
  - Kenyatta National Hospital (KNH-DEMO)
  - Aga Khan University Hospital (AKUH-DEMO)
  - Nairobi Hospital (NH-DEMO)
✓ **30 Diverse Patients:**
  - 3 Inpatients
  - 27 Outpatients
  - Various age groups (pediatric to elderly)
  - Multiple neurosurgery conditions
✓ **10 Clinic Sessions:**
  - 5 Completed (past 2 weeks)
  - 1 Today
  - 4 Upcoming

## Login Credentials

**Consultant:**
- Email: `demo.consultant@zahaniflow.com`
- Password: `DemoConsultant2025!`

**Assistant:**
- Email: `demo.assistant@zahaniflow.com`
- Password: `DemoAssistant2025!`

## Tips for Find & Replace

Use your text editor's find-and-replace feature to quickly update all placeholders:

1. Find: `YOUR_CLINIC_ID_FROM_STEP1` → Replace with actual clinic UUID
2. Find: `YOUR_CONSULTANT_AUTH_UID` → Replace with consultant's auth UUID
3. Find: `YOUR_ASSISTANT_AUTH_UID` → Replace with assistant's auth UUID
4. Find: `YOUR_CONSULTANT_PUBLIC_ID` → Replace with consultant's public users.id
5. Find: `YOUR_HOSPITAL_1_ID` → Replace with first hospital UUID
6. Find: `YOUR_HOSPITAL_2_ID` → Replace with second hospital UUID
7. Find: `YOUR_HOSPITAL_3_ID` → Replace with third hospital UUID

## Troubleshooting

**Error: "duplicate key value violates unique constraint"**
- One of the records already exists. Check patient_number, hospital code, or user email

**Error: "invalid input syntax for type uuid"**
- You forgot to replace a placeholder with an actual UUID

**Error: "violates foreign key constraint"**
- The referenced ID (clinic_id, hospital_id, etc.) doesn't exist. Double-check your IDs from previous steps

**RLS Policies Blocking Inserts:**
- Make sure migration 018 (RLS policies) has been run
- Verify the auth users exist before creating profile users
