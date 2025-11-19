-- Demo Clinic Seed Data - STEP 2b: Create Profile Users (FIXED)
-- Run this with RLS DISABLED or as service_role in Supabase SQL Editor

-- Demo Consultant (Owner) - CORRECTED UUID
INSERT INTO users (user_id, name, email, role, phone, clinic_id)
VALUES (
  'caf29399-5ec8-4302-8581-10c4096add90'::uuid, -- CONSULTANT auth UUID
  'Dr. Sarah Mwangi',
  'demo.consultant@zahaniflow.com',
  'consultant',
  '+254 712 345 678',
  'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid
)
ON CONFLICT (user_id) DO UPDATE SET 
  name = EXCLUDED.name,
  clinic_id = EXCLUDED.clinic_id
RETURNING id, user_id, name, role;

-- Demo Assistant - CORRECTED UUID
INSERT INTO users (user_id, name, email, role, phone, clinic_id)
VALUES (
  '28db690c-a759-472f-8c57-241d2fe047f8'::uuid, -- ASSISTANT auth UUID
  'Jane Kamau',
  'demo.assistant@zahaniflow.com',
  'assistant',
  '+254 723 456 789',
  'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid
)
ON CONFLICT (user_id) DO UPDATE SET 
  name = EXCLUDED.name,
  clinic_id = EXCLUDED.clinic_id
RETURNING id, user_id, name, role;

-- Update clinic owner with consultant's public users.id
UPDATE clinics 
SET owner_id = '3b9315ca-a3a6-4aae-95a2-516b957feda0'
WHERE id = 'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid;
