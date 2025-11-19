-- Demo Clinic Seed Data - STEP 4: Create 30 Demo Patients
-- Run with RLS DISABLED or as service_role

-- Demo Clinic Seed Data - STEP 4: Create 30 Demo Patients
-- Replace 'fabf53a6-8a60-4410-8097-b8aa11d2da20' with the clinic ID from step 1
-- Replace 'd4e8d743-354a-4dac-a0f8-19ae3f84a355', 'e1018d9c-dd19-4273-acb7-d0723d948c9a' with hospital IDs from step 3

BEGIN;

INSERT INTO patients (clinic_id, patient_number, first_name, last_name, date_of_birth, age, gender, phone, email, address, medical_history, allergies, blood_type, is_inpatient, current_hospital_id) VALUES
  -- Active inpatient cases (need hospital IDs)
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P002-DEMO', 'Grace', 'Wanjiku', '1978-07-22', 47, 'Female', '+254 733 222 222', 'grace.wanjiku@email.com', 'Nairobi, Karen', 'Previous stroke 2 years ago', 'Penicillin', 'A+', true, 'd4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P004-DEMO', 'Lucy', 'Akinyi', '1965-05-30', 60, 'Female', '+254 755 444 444', 'lucy.akinyi@email.com', 'Nairobi, Embakasi', 'Hypertension, Diabetes', 'Sulfa drugs', 'AB+', true, 'e1018d9c-dd19-4273-acb7-d0723d948c9a'::uuid),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P005-DEMO', 'David', 'Mutua', '1988-09-12', 36, 'Male', '+254 766 555 555', 'david.mutua@email.com', 'Machakos', 'Recent head trauma from accident', 'None', 'O-', true, 'd4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid),
  
  -- Outpatient cases
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P001-DEMO', 'John', 'Ochieng', '1985-03-15', 40, 'Male', '+254 722 111 111', 'john.ochieng@email.com', 'Nairobi, Westlands', 'Chronic headaches for 6 months', 'None', 'O+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P003-DEMO', 'Michael', 'Kipchoge', '1992-11-08', 33, 'Male', '+254 744 333 333', 'michael.k@email.com', 'Kiambu', 'Seizures since childhood', 'None', 'B+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P006-DEMO', 'Mary', 'Njeri', '1970-01-25', 55, 'Female', '+254 777 666 666', 'mary.njeri@email.com', 'Nairobi, South C', 'Migraine history 10+ years', 'Aspirin', 'A-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P007-DEMO', 'Peter', 'Otieno', '1995-06-18', 30, 'Male', '+254 788 777 777', 'peter.otieno@email.com', 'Kisumu', 'Back pain, numbness in legs', 'None', 'B-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P008-DEMO', 'Anne', 'Wambui', '1982-12-03', 42, 'Female', '+254 799 888 888', 'anne.wambui@email.com', 'Thika', 'Post-operative follow-up', 'Latex', 'O+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P009-DEMO', 'James', 'Karanja', '1975-08-20', 50, 'Male', '+254 700 999 999', 'james.k@email.com', 'Nairobi, Parklands', 'Spinal stenosis', 'None', 'AB-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P010-DEMO', 'Sarah', 'Muthoni', '1990-04-07', 35, 'Female', '+254 711 000 000', 'sarah.muthoni@email.com', 'Nakuru', 'Vertigo and dizziness', 'None', 'A+', false, NULL),
  
  -- Pediatric cases
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P011-DEMO', 'Brian', 'Omondi', '2015-02-14', 10, 'Male', '+254 722 111 000', 'parent.omondi@email.com', 'Nairobi, Kasarani', 'Epilepsy', 'None', 'O+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P012-DEMO', 'Faith', 'Chebet', '2018-09-22', 7, 'Female', '+254 733 222 111', 'parent.chebet@email.com', 'Eldoret', 'Congenital hydrocephalus', 'None', 'B+', false, NULL),
  
  -- Recent consultations
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P013-DEMO', 'Daniel', 'Kimani', '1987-11-30', 37, 'Male', '+254 744 333 222', 'daniel.kimani@email.com', 'Nairobi, Lang''ata', 'Persistent headaches', 'None', 'A+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P014-DEMO', 'Elizabeth', 'Njoroge', '1993-03-16', 32, 'Female', '+254 755 444 333', 'liz.njoroge@email.com', 'Kiambu', 'Neck pain after accident', 'Codeine', 'O-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P015-DEMO', 'Robert', 'Mwangi', '1980-07-08', 45, 'Male', '+254 766 555 444', 'robert.mw@email.com', 'Nairobi, Eastleigh', 'Memory problems', 'None', 'AB+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P016-DEMO', 'Patricia', 'Adhiambo', '1972-10-25', 53, 'Female', '+254 777 666 555', 'pat.adhiambo@email.com', 'Mombasa', 'Balance issues', 'None', 'B+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P017-DEMO', 'Kevin', 'Njuguna', '1996-01-19', 29, 'Male', '+254 788 777 666', 'kevin.njuguna@email.com', 'Nairobi, Ruaraka', 'Sports-related head injury', 'None', 'O+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P018-DEMO', 'Monica', 'Wairimu', '1984-05-11', 41, 'Female', '+254 799 888 777', 'monica.w@email.com', 'Nyeri', 'Chronic lower back pain', 'Ibuprofen', 'A-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P019-DEMO', 'Joseph', 'Kamau', '1968-09-03', 57, 'Male', '+254 700 999 888', 'joseph.kamau@email.com', 'Nairobi, Donholm', 'Parkinson''s symptoms', 'None', 'B-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P020-DEMO', 'Catherine', 'Auma', '1991-12-28', 33, 'Female', '+254 711 000 999', 'cathy.auma@email.com', 'Kisii', 'Facial numbness', 'None', 'O+', false, NULL),
  
  -- Follow-up patients
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P021-DEMO', 'Francis', 'Odhiambo', '1979-04-14', 46, 'Male', '+254 722 111 222', 'francis.o@email.com', 'Nairobi, Kilimani', 'Post-craniotomy care', 'None', 'A+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P022-DEMO', 'Rose', 'Nyambura', '1986-08-06', 39, 'Female', '+254 733 222 333', 'rose.nyambura@email.com', 'Nairobi, Muthaiga', 'Disc herniation L4-L5', 'None', 'AB+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P023-DEMO', 'Thomas', 'Wekesa', '1994-02-20', 31, 'Male', '+254 744 333 444', 'thomas.wekesa@email.com', 'Bungoma', 'Cervical radiculopathy', 'None', 'O-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P024-DEMO', 'Joyce', 'Moraa', '1977-11-12', 48, 'Female', '+254 755 444 555', 'joyce.moraa@email.com', 'Nairobi, Ngara', 'Trigeminal neuralgia', 'Carbamazepine', 'B+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P025-DEMO', 'Samuel', 'Kiptoo', '1989-06-28', 36, 'Male', '+254 766 555 666', 'samuel.kiptoo@email.com', 'Kericho', 'Spinal tumor suspected', 'None', 'A-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P026-DEMO', 'Agnes', 'Nyokabi', '1983-03-05', 42, 'Female', '+254 777 666 777', 'agnes.nyokabi@email.com', 'Nairobi, Woodley', 'Sciatica symptoms', 'None', 'O+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P027-DEMO', 'Vincent', 'Maina', '1971-10-17', 54, 'Male', '+254 788 777 888', 'vincent.maina@email.com', 'Nairobi, Pipeline', 'Cervical myelopathy', 'None', 'AB-', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P028-DEMO', 'Beatrice', 'Jepkorir', '1992-07-23', 33, 'Female', '+254 799 888 999', 'beatrice.j@email.com', 'Nairobi, Zimmerman', 'Migraine with aura', 'Triptans', 'B+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P029-DEMO', 'Patrick', 'Githuku', '1974-12-09', 51, 'Male', '+254 700 999 000', 'patrick.githuku@email.com', 'Nairobi, Kahawa', 'Lumbar radiculopathy', 'None', 'O+', false, NULL),
  ('fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid, 'P030-DEMO', 'Esther', 'Wangari', '1998-05-31', 27, 'Female', '+254 711 000 111', 'esther.wangari@email.com', 'Nairobi, Dagoretti', 'Headache evaluation', 'None', 'A+', false, NULL);

COMMIT;

-- ============================================
-- NOTES
-- ============================================
-- Successfully created 30 diverse demo patients
-- Patient numbers changed to P001-DEMO format to avoid conflicts
-- Hospital codes changed to KNH-DEMO format to avoid conflicts
