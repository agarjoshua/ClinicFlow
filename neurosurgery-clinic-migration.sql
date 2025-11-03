-- ============================================
-- CLINICFLOW - NEUROSURGERY CLINIC MIGRATION
-- Complete rebuild of database schema
-- ============================================

-- WARNING: This will DELETE ALL existing data!
-- Make sure you have a backup if needed.

-- ============================================
-- DROP OLD TABLES
-- ============================================

DROP TABLE IF EXISTS diagnoses CASCADE;
DROP TABLE IF EXISTS discharge_records CASCADE;
DROP TABLE IF EXISTS discharges CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS patient_sequence CASCADE;

-- ============================================
-- CREATE NEW TABLES
-- ============================================

-- Users table (Consultant and Assistant)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE, -- Supabase auth user ID
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('consultant', 'assistant')),
  phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Hospitals table
CREATE TABLE hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  phone text,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clinic Sessions table
CREATE TABLE clinic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES users(id),
  session_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  max_patients integer NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Patients table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  age integer,
  gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  phone text,
  email text,
  address text,
  emergency_contact text,
  emergency_contact_phone text,
  medical_history text,
  allergies text,
  current_medications text,
  blood_type text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Appointments table (patient bookings for clinic sessions)
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_session_id uuid NOT NULL REFERENCES clinic_sessions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  booking_number integer CHECK (booking_number BETWEEN 1 AND 15),
  chief_complaint text NOT NULL,
  is_priority boolean NOT NULL DEFAULT false,
  priority_reason text,
  triage_notes text,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'seen', 'rescheduled', 'cancelled')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clinical Cases table
CREATE TABLE clinical_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES users(id),
  case_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  diagnosis text,
  symptoms text,
  neurological_exam text,
  imaging_findings text,
  treatment_plan text,
  medications text,
  clinical_notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Medical Images table
CREATE TABLE medical_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_case_id uuid NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  image_type text NOT NULL CHECK (image_type IN ('MRI', 'CT', 'X-Ray', 'Ultrasound', 'Photo')),
  image_url text NOT NULL,
  thumbnail_url text,
  description text,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Procedures table
CREATE TABLE procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_case_id uuid NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  consultant_id uuid NOT NULL REFERENCES users(id),
  procedure_type text NOT NULL,
  scheduled_date date,
  scheduled_time text,
  actual_date date,
  actual_time text,
  duration integer,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'scheduled', 'done', 'postponed', 'cancelled')),
  status_reason text,
  special_instructions text,
  pre_op_assessment text,
  operative_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Post-Op Plans table
CREATE TABLE post_op_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL UNIQUE REFERENCES procedures(id) ON DELETE CASCADE,
  medications text NOT NULL,
  expected_stay_days integer,
  monitoring_frequency text CHECK (monitoring_frequency IN ('hourly', 'every-4-hours', 'daily')),
  special_care_instructions text,
  baseline_gcs integer CHECK (baseline_gcs BETWEEN 3 AND 15),
  baseline_motor_ur integer CHECK (baseline_motor_ur BETWEEN 0 AND 5),
  baseline_motor_ul integer CHECK (baseline_motor_ul BETWEEN 0 AND 5),
  baseline_motor_lr integer CHECK (baseline_motor_lr BETWEEN 0 AND 5),
  baseline_motor_ll integer CHECK (baseline_motor_ll BETWEEN 0 AND 5),
  diet_instructions text,
  activity_restrictions text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Post-Op Updates table (daily monitoring)
CREATE TABLE post_op_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  update_date date NOT NULL,
  day_post_op integer NOT NULL,
  -- Glasgow Coma Scale
  gcs_score integer NOT NULL CHECK (gcs_score BETWEEN 3 AND 15),
  -- Motor Function
  motor_ur integer NOT NULL CHECK (motor_ur BETWEEN 0 AND 5),
  motor_ul integer NOT NULL CHECK (motor_ul BETWEEN 0 AND 5),
  motor_lr integer NOT NULL CHECK (motor_lr BETWEEN 0 AND 5),
  motor_ll integer NOT NULL CHECK (motor_ll BETWEEN 0 AND 5),
  -- Vital Signs
  blood_pressure text,
  pulse integer,
  temperature numeric(4,1),
  respiratory_rate integer,
  spo2 integer CHECK (spo2 BETWEEN 0 AND 100),
  -- Clinical Notes
  current_medications text,
  improvement_notes text,
  new_complaints text,
  neurological_exam text,
  wound_status text,
  photo_urls text, -- JSON array
  -- Metadata
  updated_by uuid NOT NULL REFERENCES users(id),
  consultant_comments text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Discharges table
CREATE TABLE discharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL UNIQUE REFERENCES procedures(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  discharge_date date NOT NULL,
  total_hospital_days integer,
  discharge_status text NOT NULL CHECK (discharge_status IN ('stable', 'improved', 'against_medical_advice', 'referred', 'other')),
  -- Final Assessments
  final_gcs integer CHECK (final_gcs BETWEEN 3 AND 15),
  final_motor_ur integer CHECK (final_motor_ur BETWEEN 0 AND 5),
  final_motor_ul integer CHECK (final_motor_ul BETWEEN 0 AND 5),
  final_motor_lr integer CHECK (final_motor_lr BETWEEN 0 AND 5),
  final_motor_ll integer CHECK (final_motor_ll BETWEEN 0 AND 5),
  -- Discharge Details
  discharge_medications text,
  follow_up_instructions text,
  activity_restrictions text,
  wound_care_instructions text,
  warning_signs text,
  follow_up_date date,
  discharge_summary text,
  -- Metadata
  discharged_by uuid NOT NULL REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_hospitals_code ON hospitals(code);

CREATE INDEX idx_clinic_sessions_hospital_id ON clinic_sessions(hospital_id);
CREATE INDEX idx_clinic_sessions_consultant_id ON clinic_sessions(consultant_id);
CREATE INDEX idx_clinic_sessions_date ON clinic_sessions(session_date);
CREATE INDEX idx_clinic_sessions_status ON clinic_sessions(status);

CREATE INDEX idx_patients_patient_number ON patients(patient_number);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);

CREATE INDEX idx_appointments_clinic_session_id ON appointments(clinic_session_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_priority ON appointments(is_priority);

CREATE INDEX idx_clinical_cases_patient_id ON clinical_cases(patient_id);
CREATE INDEX idx_clinical_cases_consultant_id ON clinical_cases(consultant_id);
CREATE INDEX idx_clinical_cases_appointment_id ON clinical_cases(appointment_id);
CREATE INDEX idx_clinical_cases_status ON clinical_cases(status);

CREATE INDEX idx_medical_images_clinical_case_id ON medical_images(clinical_case_id);

CREATE INDEX idx_procedures_clinical_case_id ON procedures(clinical_case_id);
CREATE INDEX idx_procedures_patient_id ON procedures(patient_id);
CREATE INDEX idx_procedures_hospital_id ON procedures(hospital_id);
CREATE INDEX idx_procedures_consultant_id ON procedures(consultant_id);
CREATE INDEX idx_procedures_status ON procedures(status);
CREATE INDEX idx_procedures_scheduled_date ON procedures(scheduled_date);

CREATE INDEX idx_post_op_plans_procedure_id ON post_op_plans(procedure_id);

CREATE INDEX idx_post_op_updates_procedure_id ON post_op_updates(procedure_id);
CREATE INDEX idx_post_op_updates_date ON post_op_updates(update_date);
CREATE INDEX idx_post_op_updates_day ON post_op_updates(day_post_op);

CREATE INDEX idx_discharges_procedure_id ON discharges(procedure_id);
CREATE INDEX idx_discharges_patient_id ON discharges(patient_id);
CREATE INDEX idx_discharges_date ON discharges(discharge_date);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PERMISSIVE FOR NOW
-- (Can be tightened later for consultant vs assistant)
-- ============================================

-- Allow authenticated users to do everything for now
-- We'll implement proper role-based policies after testing

CREATE POLICY "Allow all for authenticated users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON hospitals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON clinic_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON appointments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON clinical_cases
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON medical_images
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON procedures
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON post_op_plans
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON post_op_updates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON discharges
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INSERT SAMPLE HOSPITALS
-- ============================================

INSERT INTO hospitals (name, code, address, phone, color) VALUES
  ('Synergy Hospital', 'SYNERGY', '123 Medical Center Drive', '+1 (555) 100-0001', '#3b82f6'),
  ('Aga Khan Hospital', 'AGA_KHAN', '456 Healthcare Blvd', '+1 (555) 100-0002', '#10b981'),
  ('Bloom Hospital', 'BLOOM', '789 Wellness Ave', '+1 (555) 100-0003', '#f59e0b'),
  ('MaxCure Hospital', 'MAXCURE', '321 Care Street', '+1 (555) 100-0004', '#ef4444'),
  ('Jaramogi Oginga Odinga Teaching and Referal Hospital', 'JOORTH', '654 Health Plaza', '+1 (555) 100-0005', '#8b5cf6');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

-- Migration complete!
-- Next steps:
-- 1. Create your consultant and assistant users in Supabase Auth
-- 2. Insert records into the users table linking to auth.users
-- 3. Start building the UI!
