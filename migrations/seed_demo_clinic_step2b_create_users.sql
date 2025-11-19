-- Demo Clinic Seed Data - STEP 2b: Create Profile Users
-- Run this AFTER you have:
--   1. Created the auth users in Supabase Auth Dashboard
--   2. Run step 2 to get their auth UIDs
--   3. Replace the placeholders below with actual IDs

-- Demo Consultant (Owner)
INSERT INTO users (user_id, name, email, role, phone, clinic_id)
VALUES (
  '28db690c-a759-472f-8c57-241d2fe047f8'::uuid,
  'Dr. Sarah Mwangi',
  'demo.consultant@zahaniflow.com',
  'consultant',
  '+254 712 345 678',
  'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid
)
RETURNING id, user_id, name, role;

-- COPY THE RETURNED 'id' VALUE FROM ABOVE! That's the public users.id (NOT the user_id)
-- Then replace PASTE_CONSULTANT_PUBLIC_ID below and run the rest of the script

-- Demo Assistant
INSERT INTO users (user_id, name, email, role, phone, clinic_id)
VALUES (
  'caf29399-5ec8-4302-8581-10c4096add90'::uuid,
  'Jane Kamau',
  'demo.assistant@zahaniflow.com',
  'assistant',
  '+254 723 456 789',
  'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid
)
RETURNING id, user_id, name, role;

-- Update clinic owner (replace PASTE_CONSULTANT_PUBLIC_ID with the consultant's 'id' from the first query)
UPDATE clinics 
SET owner_id = 'PASTE_CONSULTANT_PUBLIC_ID' -- Replace with consultant's public users.id (the 'id' column, NOT user_id)
WHERE id = 'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid;

-- ============================================
-- NOTES
-- ============================================
-- After running this script successfully, proceed to step 3
