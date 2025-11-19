-- Demo Clinic Seed Data for ZahaniFlow
-- This script creates a fully populated demo clinic for marketing and social media
-- Date: 2025-11-19

BEGIN;

-- ============================================
-- STEP 1: Create Demo Clinic
-- ============================================

INSERT INTO clinics (id, name, slug, owner_id, subscription_tier, subscription_status, max_consultants, max_assistants, settings)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Nairobi Neurosurgery Center - Demo',
  'nairobi-neurosurgery-demo',
  NULL, -- Will be set when creating demo users
  'professional',
  'active',
  5,
  10,
  '{"demo": true, "features": ["advanced_analytics", "multi_location", "api_access"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- ============================================
-- STEP 2: Create Demo Users
-- ============================================

-- Demo Consultant (Owner)
INSERT INTO users (id, user_id, name, email, role, phone, clinic_id)
VALUES (
  'demo-consultant-001',
  'demo-consultant-auth-001', -- You'll need to create this in Supabase Auth
  'Dr. Sarah Mwangi',
  'demo.consultant@zahaniflow.com',
  'consultant',
  '+254 712 345 678',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
) ON CONFLICT (user_id) DO UPDATE SET clinic_id = EXCLUDED.clinic_id;

-- Demo Assistant
INSERT INTO users (id, user_id, name, email, role, phone, clinic_id)
VALUES (
  'demo-assistant-001',
  'demo-assistant-auth-001', -- You'll need to create this in Supabase Auth
  'Jane Kamau',
  'demo.assistant@zahaniflow.com',
  'assistant',
  '+254 723 456 789',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
) ON CONFLICT (user_id) DO UPDATE SET clinic_id = EXCLUDED.clinic_id;

-- Update clinic owner
UPDATE clinics SET owner_id = 'demo-consultant-001' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

-- ============================================
-- STEP 3: Create Hospitals
-- ============================================

INSERT INTO hospitals (id, name, code, address, phone, color, clinic_id) VALUES
  ('demo-hosp-001', 'Kenyatta National Hospital', 'KNH', 'Hospital Rd, Nairobi', '+254 20 2726300', '#3b82f6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  ('demo-hosp-002', 'Aga Khan University Hospital', 'AKUH', '3rd Parklands Ave, Nairobi', '+254 20 3662000', '#10b981', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  ('demo-hosp-003', 'Nairobi Hospital', 'NH', 'Argwings Kodhek Rd, Nairobi', '+254 20 2845000', '#f59e0b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)
ON CONFLICT (code) DO UPDATE SET clinic_id = EXCLUDED.clinic_id;

-- ============================================
-- STEP 4: Create Demo Patients (30 patients)
-- ============================================

INSERT INTO patients (id, clinic_id, patient_number, first_name, last_name, date_of_birth, age, gender, phone, email, address, medical_history, allergies, blood_type, is_inpatient, current_hospital_id) VALUES
  -- Active cases
  ('demo-pat-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P001-2025', 'John', 'Ochieng', '1985-03-15', 40, 'Male', '+254 722 111 111', 'john.ochieng@email.com', 'Nairobi, Westlands', 'Chronic headaches for 6 months', 'None', 'O+', false, NULL),
  ('demo-pat-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P002-2025', 'Grace', 'Wanjiku', '1978-07-22', 47, 'Female', '+254 733 222 222', 'grace.wanjiku@email.com', 'Nairobi, Karen', 'Previous stroke 2 years ago', 'Penicillin', 'A+', true, 'demo-hosp-001'),
  ('demo-pat-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P003-2025', 'Michael', 'Kipchoge', '1992-11-08', 33, 'Male', '+254 744 333 333', 'michael.k@email.com', 'Kiambu', 'Seizures since childhood', 'None', 'B+', false, NULL),
  ('demo-pat-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P004-2025', 'Lucy', 'Akinyi', '1965-05-30', 60, 'Female', '+254 755 444 444', 'lucy.akinyi@email.com', 'Nairobi, Embakasi', 'Hypertension, Diabetes', 'Sulfa drugs', 'AB+', true, 'demo-hosp-002'),
  ('demo-pat-005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P005-2025', 'David', 'Mutua', '1988-09-12', 36, 'Male', '+254 766 555 555', 'david.mutua@email.com', 'Machakos', 'Recent head trauma from accident', 'None', 'O-', true, 'demo-hosp-001'),
  
  -- Chronic cases
  ('demo-pat-006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P006-2025', 'Mary', 'Njeri', '1970-01-25', 55, 'Female', '+254 777 666 666', 'mary.njeri@email.com', 'Nairobi, South C', 'Migraine history 10+ years', 'Aspirin', 'A-', false, NULL),
  ('demo-pat-007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P007-2025', 'Peter', 'Otieno', '1995-06-18', 30, 'Male', '+254 788 777 777', 'peter.otieno@email.com', 'Kisumu', 'Back pain, numbness in legs', 'None', 'B-', false, NULL),
  ('demo-pat-008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P008-2025', 'Anne', 'Wambui', '1982-12-03', 42, 'Female', '+254 799 888 888', 'anne.wambui@email.com', 'Thika', 'Post-operative follow-up', 'Latex', 'O+', false, NULL),
  ('demo-pat-009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P009-2025', 'James', 'Karanja', '1975-08-20', 50, 'Male', '+254 700 999 999', 'james.k@email.com', 'Nairobi, Parklands', 'Spinal stenosis', 'None', 'AB-', false, NULL),
  ('demo-pat-010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P010-2025', 'Sarah', 'Muthoni', '1990-04-07', 35, 'Female', '+254 711 000 000', 'sarah.muthoni@email.com', 'Nakuru', 'Vertigo and dizziness', 'None', 'A+', false, NULL),
  
  -- Pediatric cases
  ('demo-pat-011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P011-2025', 'Brian', 'Omondi', '2015-02-14', 10, 'Male', '+254 722 111 000', 'parent.omondi@email.com', 'Nairobi, Kasarani', 'Epilepsy', 'None', 'O+', false, NULL),
  ('demo-pat-012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P012-2025', 'Faith', 'Chebet', '2018-09-22', 7, 'Female', '+254 733 222 111', 'parent.chebet@email.com', 'Eldoret', 'Congenital hydrocephalus', 'None', 'B+', false, NULL),
  
  -- Recent consultations
  ('demo-pat-013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P013-2025', 'Daniel', 'Kimani', '1987-11-30', 37, 'Male', '+254 744 333 222', 'daniel.kimani@email.com', 'Nairobi, Lang''ata', 'Persistent headaches', 'None', 'A+', false, NULL),
  ('demo-pat-014', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P014-2025', 'Elizabeth', 'Njoroge', '1993-03-16', 32, 'Female', '+254 755 444 333', 'liz.njoroge@email.com', 'Kiambu', 'Neck pain after accident', 'Codeine', 'O-', false, NULL),
  ('demo-pat-015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P015-2025', 'Robert', 'Mwangi', '1980-07-08', 45, 'Male', '+254 766 555 444', 'robert.mw@email.com', 'Nairobi, Eastleigh', 'Memory problems', 'None', 'AB+', false, NULL),
  ('demo-pat-016', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P016-2025', 'Patricia', 'Adhiambo', '1972-10-25', 53, 'Female', '+254 777 666 555', 'pat.adhiambo@email.com', 'Mombasa', 'Balance issues', 'None', 'B+', false, NULL),
  ('demo-pat-017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P017-2025', 'Kevin', 'Njuguna', '1996-01-19', 29, 'Male', '+254 788 777 666', 'kevin.njuguna@email.com', 'Nairobi, Ruaraka', 'Sports-related head injury', 'None', 'O+', false, NULL),
  ('demo-pat-018', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P018-2025', 'Monica', 'Wairimu', '1984-05-11', 41, 'Female', '+254 799 888 777', 'monica.w@email.com', 'Nyeri', 'Chronic lower back pain', 'Ibuprofen', 'A-', false, NULL),
  ('demo-pat-019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P019-2025', 'Joseph', 'Kamau', '1968-09-03', 57, 'Male', '+254 700 999 888', 'joseph.kamau@email.com', 'Nairobi, Donholm', 'Parkinson''s symptoms', 'None', 'B-', false, NULL),
  ('demo-pat-020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P020-2025', 'Catherine', 'Auma', '1991-12-28', 33, 'Female', '+254 711 000 999', 'cathy.auma@email.com', 'Kisii', 'Facial numbness', 'None', 'O+', false, NULL),
  
  -- Follow-up patients
  ('demo-pat-021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P021-2025', 'Francis', 'Odhiambo', '1979-04-14', 46, 'Male', '+254 722 111 222', 'francis.o@email.com', 'Nairobi, Kilimani', 'Post-craniotomy care', 'None', 'A+', false, NULL),
  ('demo-pat-022', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P022-2025', 'Rose', 'Nyambura', '1986-08-06', 39, 'Female', '+254 733 222 333', 'rose.nyambura@email.com', 'Nairobi, Muthaiga', 'Disc herniation L4-L5', 'None', 'AB+', false, NULL),
  ('demo-pat-023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P023-2025', 'Thomas', 'Wekesa', '1994-02-20', 31, 'Male', '+254 744 333 444', 'thomas.wekesa@email.com', 'Bungoma', 'Cervical radiculopathy', 'None', 'O-', false, NULL),
  ('demo-pat-024', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P024-2025', 'Joyce', 'Moraa', '1977-11-12', 48, 'Female', '+254 755 444 555', 'joyce.moraa@email.com', 'Nairobi, Ngara', 'Trigeminal neuralgia', 'Carbamazepine', 'B+', false, NULL),
  ('demo-pat-025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P025-2025', 'Samuel', 'Kiptoo', '1989-06-28', 36, 'Male', '+254 766 555 666', 'samuel.kiptoo@email.com', 'Kericho', 'Spinal tumor suspected', 'None', 'A-', false, NULL),
  ('demo-pat-026', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P026-2025', 'Agnes', 'Nyokabi', '1983-03-05', 42, 'Female', '+254 777 666 777', 'agnes.nyokabi@email.com', 'Nairobi, Woodley', 'Sciatica symptoms', 'None', 'O+', false, NULL),
  ('demo-pat-027', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P027-2025', 'Vincent', 'Maina', '1971-10-17', 54, 'Male', '+254 788 777 888', 'vincent.maina@email.com', 'Nairobi, Pipeline', 'Cervical myelopathy', 'None', 'AB-', false, NULL),
  ('demo-pat-028', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P028-2025', 'Beatrice', 'Jepkorir', '1992-07-23', 33, 'Female', '+254 799 888 999', 'beatrice.j@email.com', 'Nairobi, Zimmerman', 'Migraine with aura', 'Triptans', 'B+', false, NULL),
  ('demo-pat-029', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P029-2025', 'Patrick', 'Githuku', '1974-12-09', 51, 'Male', '+254 700 999 000', 'patrick.githuku@email.com', 'Nairobi, Kahawa', 'Lumbar radiculopathy', 'None', 'O+', false, NULL),
  ('demo-pat-030', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'P030-2025', 'Esther', 'Wangari', '1998-05-31', 27, 'Female', '+254 711 000 111', 'esther.wangari@email.com', 'Nairobi, Dagoretti', 'Headache evaluation', 'None', 'A+', false, NULL)
ON CONFLICT (patient_number) DO UPDATE SET clinic_id = EXCLUDED.clinic_id;

-- ============================================
-- STEP 5: Create Clinic Sessions (Past and Upcoming)
-- ============================================

INSERT INTO clinic_sessions (id, hospital_id, consultant_id, session_date, start_time, end_time, max_patients, status) VALUES
  -- Past sessions (last 2 weeks)
  ('demo-sess-001', 'demo-hosp-001', 'demo-consultant-001', CURRENT_DATE - INTERVAL '14 days', '09:00', '17:00', 20, 'completed'),
  ('demo-sess-002', 'demo-hosp-002', 'demo-consultant-001', CURRENT_DATE - INTERVAL '13 days', '10:00', '16:00', 15, 'completed'),
  ('demo-sess-003', 'demo-hosp-001', 'demo-consultant-001', CURRENT_DATE - INTERVAL '10 days', '09:00', '17:00', 20, 'completed'),
  ('demo-sess-004', 'demo-hosp-003', 'demo-consultant-001', CURRENT_DATE - INTERVAL '7 days', '09:00', '15:00', 15, 'completed'),
  ('demo-sess-005', 'demo-hosp-001', 'demo-consultant-001', CURRENT_DATE - INTERVAL '5 days', '09:00', '17:00', 20, 'completed'),
  
  -- Today's session
  ('demo-sess-006', 'demo-hosp-001', 'demo-consultant-001', CURRENT_DATE, '09:00', '17:00', 20, 'scheduled'),
  
  -- Upcoming sessions
  ('demo-sess-007', 'demo-hosp-002', 'demo-consultant-001', CURRENT_DATE + INTERVAL '2 days', '10:00', '16:00', 15, 'scheduled'),
  ('demo-sess-008', 'demo-hosp-001', 'demo-consultant-001', CURRENT_DATE + INTERVAL '5 days', '09:00', '17:00', 20, 'scheduled'),
  ('demo-sess-009', 'demo-hosp-003', 'demo-consultant-001', CURRENT_DATE + INTERVAL '7 days', '09:00', '15:00', 15, 'scheduled'),
  ('demo-sess-010', 'demo-hosp-001', 'demo-consultant-001', CURRENT_DATE + INTERVAL '10 days', '09:00', '17:00', 20, 'scheduled')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- NOTES
-- ============================================
-- 1. After running this script, you need to:
--    - Create auth users in Supabase Auth for:
--      * demo.consultant@zahaniflow.com (password: DemoConsultant2025!)
--      * demo.assistant@zahaniflow.com (password: DemoAssistant2025!)
--    - Get their auth UIDs and update the user_id fields above
--    - Run additional scripts to create appointments, diagnoses, procedures
-- 2. All data is scoped to clinic ID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- 3. This creates 30 diverse patients showcasing various neurosurgery cases
-- 4. Sessions span past, present, and future for demo purposes
